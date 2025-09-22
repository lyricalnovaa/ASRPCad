const db = require('../firebase/firebase');

async function getUserByDiscordId(discordId) {
    const userRef = db.collection('users').doc(discordId);
    const doc = await userRef.get();
    if (!doc.exists) return null;
    return doc.data();
}

async function createUser(userData) {
    await db.collection('users').doc(userData.discordId).set(userData);
}

async function updateUser(discordId, data) {
    await db.collection('users').doc(discordId).update(data);
}

async function getAllUsers() {
    const usersSnapshot = await db.collection('users').get();
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
    getUserByDiscordId,
    createUser,
    updateUser,
    getAllUsers
};
