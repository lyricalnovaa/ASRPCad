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
const ERLC_API_URL = 'YOUR_ERLC_API_URL_FOR_GETTING_UNITS';
const ERLC_SERVER_KEY = process.env.ERLC_SERVER_KEY;

async function fetchErlcData() {
    try {
        const headers = { 'Server-Key': ERLC_SERVER_KEY };
        const response = await axios.get(ERLC_API_URL, { headers });
        const erlcUnits = response.data;
        
        const unitsBatch = db.batch();
        const unitsSnapshot = await db.collection('units').get();
        unitsSnapshot.docs.forEach(doc => {
            const unit = erlcUnits.find(u => u.callsign === doc.data().callsign);
            if (unit) {
                unitsBatch.update(doc.ref, unit);
            }
        });
        await unitsBatch.commit();
        
        io.emit('live_units_update', erlcUnits);
    } catch (error) {
        console.error('Error fetching ERLC data:', error.message);
    }
}

setInterval(fetchErlcData, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
