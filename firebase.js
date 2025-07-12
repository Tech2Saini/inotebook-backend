require('dotenv').config({
  path: require('path').resolve(__dirname, '.env')
});
const admin = require('firebase-admin');
 

admin.initializeApp({
  credential: admin.credential.cert({
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "client_email":process.env.FIREBASE_CLIENT_EMAIL,
    "private_key": process.env.FIREBASE_PRIVATE_KEY
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
});
 
// You can export both
const db = admin.database();
const auth = admin.auth();


module.exports = { admin, db, auth };


