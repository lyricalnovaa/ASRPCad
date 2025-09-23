const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const db = require('./firebase/firebase');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

// Add this route to serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

const authRoutes = require('./routes/auth');
const cadRoutes = require('./routes/cad');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/cad', cadRoutes);
app.use('/api/admin', adminRoutes);

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('disconnect', () => console.log('User disconnected'));
});

// ERLC API Polling
const ERLC_API_URL = 'https://api.policeroleplay.community/v1/server/players';
const ERLC_SERVER_KEY = process.env.ERLC_SERVER_KEY;

async function fetchErlcData() {
    try {
        const headers = { 'server-key': ERLC_SERVER_KEY, 'Accept': '*/*' };
        const response = await axios.get(ERLC_API_URL, { headers });
        const allPlayers = response.data;

        const activeUnits = allPlayers
            .filter(player => player.Team === 'Police' || player.Team === 'Sheriff')
            .map(unit => {
                const playerName = unit.Player.split(':')[0];
                return {
                    callsign: unit.Callsign,
                    playerName: playerName,
                    team: unit.Team,
                    status: 'Active'
                };
            });

        // Use a batch to delete all documents in the 'units' collection
        const existingUnitsSnapshot = await db.collection('units').get();
        const deleteBatch = db.batch();
        existingUnitsSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        
        // Add new active units to the 'units' collection
        const addBatch = db.batch();
        activeUnits.forEach(unit => {
            const docRef = db.collection('units').doc(unit.callsign);
            addBatch.set(docRef, unit);
        });
        await addBatch.commit();

        io.emit('live_units_update', activeUnits);
    } catch (error) {
        console.error('Error fetching ERLC data:', error.message);
    }
}

setInterval(fetchErlcData, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
