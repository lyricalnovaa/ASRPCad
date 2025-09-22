const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../firebase/firebase');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized: Token not provided.' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden: Invalid token.' });
        req.user = user;
        next();
    });
};

const checkPermission = (requiredPermission) => (req, res, next) => {
    if (req.user && req.user.key.includes(requiredPermission)) {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }
};

module.exports = { authenticateJWT, checkPermission };
