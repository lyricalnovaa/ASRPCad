const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cadRouter = express.Router();
const db = require('../firebase/firebase');
const { authenticateJWT, checkPermission } = require('../middleware/auth');

cadRouter.get('/calls', authenticateJWT, async (req, res) => {
    const callsSnapshot = await db.collection('calls').get();
    const calls = callsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(calls);
});

cadRouter.post('/calls', authenticateJWT, checkPermission('dispatch.create_call'), async (req, res) => {
    const newCall = { id: uuidv4(), ...req.body, status: 'Active', timestamp: new Date() };
    await db.collection('calls').doc(newCall.id).set(newCall);
    res.status(201).json(newCall);
});

cadRouter.get('/units', authenticateJWT, async (req, res) => {
    const unitsSnapshot = await db.collection('units').get();
    const units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(units);
});

cadRouter.post('/units/status', authenticateJWT, checkPermission('police.update_status'), async (req, res) => {
    const { callsign, status } = req.body;
    const unitSnapshot = await db.collection('units').where('callsign', '==', callsign).get();
    if (unitSnapshot.empty) {
        return res.status(404).json({ message: 'Unit not found.' });
    }
    const unitDoc = unitSnapshot.docs[0];
    await unitDoc.ref.update({ status: status });
    res.json({ message: 'Status updated successfully.' });
});

module.exports = cadRouter;
