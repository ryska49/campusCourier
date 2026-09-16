const express = require('express');
const router = express.Router();

const { sendOtp, signup, login, googleAuth } = require('../controllers/authController');

router.post('/send-otp', sendOtp);  // Step 1 — validate NITW email, send OTP
router.post('/signup', signup);     // Step 2 — verify OTP, create account
router.post('/login', login);       // Login with email + password
router.post('/google', googleAuth); // Login / signup with Google OAuth

module.exports = router;