// middleware/getUserDetails.js
// const { auth } = require("firebase-admin");
const { admin, auth } = require("../firebase");

module.exports = async function (req, res, next) {
  const token = req.header('auth-token');

  if (!token) {
    return res.status(401).json({ status: false, message: "No auth token provided" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);

    req.user = { id: decodedToken.uid };
    next();
  } catch (error) {

    let message = "Invalid user auth token";
    if (error.code === 'auth/id-token-expired') {
      message = "Session expired. Please login again.";
    } else if (error.code === 'auth/id-token-revoked') {
      message = "Session revoked. Please login again.";
    }
    
    res.status(401).json({ status: false, message: message });
  }
};
