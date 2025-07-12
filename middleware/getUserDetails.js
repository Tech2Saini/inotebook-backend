// middleware/getUserDetails.js
// const { auth } = require("firebase-admin");
const {admin,auth} = require("../firebase");

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
    console.error(error);
    res.status(401).json({ status: false, message: "Invalid user auth token" });
  }
};
