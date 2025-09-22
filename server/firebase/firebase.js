const admin = require('firebase-admin');
require('dotenv').config();

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it is a valid stringified JSON object.", error);
  process.exit(1);
}

const db = admin.firestore();

module.exports = db;
