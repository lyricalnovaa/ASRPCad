const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const authRouter = express.Router();
const { rolePermissionMapping } = require('../models/key');
const { getUserByDiscordId, createUser, updateUser } = require('../models/user');
const { authenticateJWT } = require('../middleware/auth');

const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_DISCORD_CLIENT_SECRET';
const REDIRECT_URI = 'https://your-render-url.onrender.com/api/auth/discord/callback';
const GUILD_ID = 'YOUR_GUILD_ID';

authRouter.get('/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
    res.redirect(discordAuthUrl);
});

authRouter.get('/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).json({ message: 'Discord authentication failed.' });

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            scope: 'identify guilds guilds.members.read'
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const accessToken = tokenResponse.data.access_token;
        const userResponse = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${accessToken}` } });
        const guildMemberResponse = await axios.get(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, { headers: { Authorization: `Bearer ${accessToken}` } });
        
        const discordUser = userResponse.data;
        const guildMember = guildMemberResponse.data;
        const discordRoles = guildMember.roles.map(roleId => guildMember.roles.find(r => r.id === roleId).name);
        
        let assignedPermissionKey = 'civilian.create_character';
        let assignedRole = 'Civilian';

        for (const role of discordRoles) {
            if (rolePermissionMapping[role]) {
                assignedPermissionKey = rolePermissionMapping[role];
                assignedRole = role;
                break;
            }
        }

        const user = await getUserByDiscordId(discordUser.id);
        if (!user) {
            await createUser({
                discordId: discordUser.id,
                username: discordUser.username,
                email: discordUser.email || null,
                permissionKey: assignedPermissionKey,
                role: assignedRole,
                discordRoles: discordRoles
            });
        } else {
            await updateUser(discordUser.id, {
                permissionKey: assignedPermissionKey,
                role: assignedRole,
                discordRoles: discordRoles
            });
        }
        
        const token = jwt.sign({ userId: discordUser.id, key: assignedPermissionKey, role: assignedRole, discordRoles: discordRoles }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.redirect(`/dashboard.html?token=${token}`);

    } catch (error) {
        console.error('Discord OAuth2 error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Discord authentication failed.' });
    }
});

authRouter.post('/switch-role', authenticateJWT, async (req, res) => {
    const { newRole } = req.body;
    const user = req.user;
    
    const userDoc = await getUserByDiscordId(user.userId);
    const discordRoles = userDoc.discordRoles;

    if (!discordRoles.includes(newRole)) {
        return res.status(403).json({ message: 'Invalid role switch.' });
    }

    const newPermissionKey = rolePermissionMapping[newRole];
    await updateUser(user.userId, { permissionKey: newPermissionKey, role: newRole });
    const newToken = jwt.sign({ userId: user.userId, key: newPermissionKey, role: newRole, discordRoles: discordRoles }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token: newToken });
});

module.exports = authRouter;
