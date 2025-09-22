const express = require('express');
const adminRouter = express.Router();
const { getAllUsers, updateUser } = require('../models/user');
const { authenticateJWT, checkPermission } = require('../middleware/auth');

adminRouter.get('/users', authenticateJWT, checkPermission('admin.full_access'), async (req, res) => {
    const users = await getAllUsers();
    res.json(users);
});

adminRouter.post('/users/assign-key', authenticateJWT, checkPermission('admin.full_access'), async (req, res) => {
    const { userId, permissionKey, role } = req.body;
    await updateUser(userId, { permissionKey, role });
    res.json({ message: `Permission key '${permissionKey}' assigned to user '${userId}'.` });
});

module.exports = adminRouter;
