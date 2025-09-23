const express = require('express');
const jwt = require('jsonwebtoken');
const authRouter = express.Router();
const db = require('../firebase/firebase');
const { authenticateJWT } = require('../middleware/auth');

// A simple function for hashing passwords
const bcrypt = {
    hash: async (password) => password, // Placeholder, replace with real bcrypt
    compare: async (password, hash) => password === hash // Placeholder
};

// --- ROUTES ---

// Registration Route
authRouter.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const userRef = db.collection('users').doc(username);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password);
        const newUser = {
            username: username,
            password: hashedPassword,
            role: 'Civilian' // Default role
        };

        await userRef.set(newUser);
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Login Route
authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const userRef = db.collection('users').doc(username);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = userDoc.data();
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Route to check admin role
authRouter.get('/check-admin', authenticateJWT, (req, res) => {
    if (req.user.role === 'Admin') {
        res.json({ isAdmin: true });
    } else {
        res.json({ isAdmin: false });
    }
});

module.exports = authRouter;
