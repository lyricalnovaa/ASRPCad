const admin = require('firebase-admin');
require('dotenv').config();

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseId: 'Database'
  });

} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK. Check your environment variables.", error);
  process.exit(1);
}

const db = admin.firestore();

module.exports = db;
