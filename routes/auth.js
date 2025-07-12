// routes/auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {admin,auth} = require("../firebase"); // your firebase.js exports admin
const getUserDetails = require("../middleware/getUserDetails");

// ROUTE 1: Register a new user with Email, Password & Name
router.post('/signup',
  [
    body('email', "Enter a valid email address").isEmail(),
    body("password", "Password must be longer than 8 characters").isLength({ min: 8 }),
    body("name", "Name must be longer than 3 characters").isLength({ min: 3 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      let existingUser;
      try {
        existingUser = await auth.getUserByEmail(email);
      } catch (err) {
        existingUser = null; // not found
      }

      if (existingUser) {
        return res.status(403).json({
          status: false,
          message: `Email (${email}) already exists. Please use a different email!`
        });
      }

      // Create new user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name
      });

      // Create a custom JWT token for the new user (optional)
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      res.status(201).json({
        status: true,
        message: "User created successfully!",
        uid: userRecord.uid,
        userToken: customToken // this is your auth token for client to exchange
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Some error occurred.", error: error.message });
    }
  }
);

// ROUTE 2: Login user using Email & Password — Note: with Firebase you normally do this on the frontend!
router.post("/login",
  [
    body('email', "Enter a valid email address!").isEmail(),
    body("password", "Password must be longer than 8 characters").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const { email, password } = req.body;

    // ⚡️ IMPORTANT ⚡️
    // Firebase Auth Email/Password login happens on the CLIENT side using firebase/auth.
    // On backend, you can use REST API if needed. Here's how to call it using fetch.

    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBbiR58z1vVauf_yNc7di_TCDxAmpbr_gQ`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      });

      const data = await response.json();
      if (data.error) {
        return res.status(400).json({ status: false, message: data.error.message });
      }

      res.status(200).json({
        status: true,
        message: "User login successful!",
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        uid: data.localId
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Login failed", error: error.message });
    }
  }
);

// ROUTE 3: Get user details using Firebase verified token
router.post('/getuser', getUserDetails, async (req, res) => {
  try {
    const userRecord = await admin.auth().getUser(req.user.id);
    res.status(200).json({
      status: true,
      message: "User fetched successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName
      }
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ status: false, message: "Invalid user auth token!" });
  }
});

module.exports = router;
