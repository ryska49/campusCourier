const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const sendOtpEmail = require('../utils/sendOtpEmail');

// Helper — generates a random 6-digit OTP string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper — checks if email belongs to NITW (@student.nitw.ac.in or @nitw.ac.in)
const isNitwEmail = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower.endsWith('@student.nitw.ac.in') || lower.endsWith('@nitw.ac.in');
};

// Google OAuth client — verifies ID tokens issued by Google
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ─────────────────────────────────────────────
// @route  POST /api/auth/send-otp
// Step 1 of signup — validate NITW email, send OTP
// ─────────────────────────────────────────────
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Must be a real NITW student/faculty email
        if (!isNitwEmail(email)) {
            return res.status(400).json({ message: 'Only @student.nitw.ac.in or @nitw.ac.in email addresses are allowed' });
        }

        // 2. Check not already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'This email is already registered. Please login.' });
        }

        // 3. Invalidate any previous unused OTPs for this email
        await Otp.deleteMany({ email: email.toLowerCase() });

        // 4. Generate new OTP and save to DB (expires in 10 minutes)
        const code = generateOtp();
        await Otp.create({
            email: email.toLowerCase(),
            code,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
        });

        // 5. Send OTP email
        await sendOtpEmail(email.toLowerCase(), code);

        res.status(200).json({ message: `OTP sent to ${email}` });
    } catch (error) {
        console.error('sendOtp error:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// @route  POST /api/auth/signup
// Step 2 of signup — verify OTP, create account
// ─────────────────────────────────────────────
const signup = async (req, res) => {
    try {
        const { name, email, password, otp, hostelName, phone } = req.body;

        // 1. Basic validation
        if (!name || !email || !password || !otp) {
            return res.status(400).json({ message: 'Name, email, password and OTP are required' });
        }

        // 2. Domain check (double-check server-side even if frontend already validated)
        if (!isNitwEmail(email)) {
            return res.status(400).json({ message: 'Only @student.nitw.ac.in or @nitw.ac.in email addresses are allowed' });
        }

        // 3. Check not already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // 4. Find the OTP record
        const otpRecord = await Otp.findOne({ email: email.toLowerCase(), used: false });

        if (!otpRecord) {
            return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
        }

        // 5. Check expiry
        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // 6. Check OTP matches
        if (otpRecord.code !== otp.trim()) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        // 7. Mark OTP as used (prevents reuse)
        otpRecord.used = true;
        await otpRecord.save();

        // 8. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 9. Create the user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            hostelName,
            phone,
            authProvider: 'email',
        });

        // 10. Return JWT — immediately logged in after signup
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                campusCredits: user.campusCredits,
            },
        });
    } catch (error) {
        console.error('signup error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────
// @route  POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Must be NITW email
        if (!isNitwEmail(email)) {
            return res.status(400).json({ message: 'Only @student.nitw.ac.in or @nitw.ac.in email addresses are allowed' });
        }

        // 2. Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 3. If Google user tries to login with password
        if (user.authProvider === 'google') {
            return res.status(400).json({ message: 'This account uses Google Sign-In. Please use "Continue with Google".' });
        }

        // 4. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 5. Generate token
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                campusCredits: user.campusCredits,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─────────────────────────────────────────────
// @route  POST /api/auth/google
// Sign in / sign up with Google — NITW domain only
// ─────────────────────────────────────────────
const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'ID token is required' });
        }

        // 1. Verify the token with Google — this guarantees it's a real Google account
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        // 2. Domain restriction — @student.nitw.ac.in or @nitw.ac.in allowed
        if (!isNitwEmail(email)) {
            return res.status(403).json({
                message: 'Only @student.nitw.ac.in or @nitw.ac.in Google accounts are allowed.',
            });
        }


        // 3. Find existing user OR create a new one (Google users have no password)
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // New user — create account automatically (no OTP needed, Google verified them)
            user = await User.create({
                name,
                email: email.toLowerCase(),
                authProvider: 'google',
                // no password field — Google users don't have one
            });
        } else if (user.authProvider === 'email') {
            // Edge case: user signed up with email/OTP before, now trying Google
            // Allow it but keep their existing account
        }

        // 4. Return JWT — same as normal login
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                campusCredits: user.campusCredits,
            },
        });
    } catch (error) {
        console.error('googleAuth error:', error);
        // Google token verification failure comes as an error from the library
        if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
            return res.status(401).json({ message: 'Invalid or expired Google token. Please try again.' });
        }
        res.status(500).json({ message: 'Google sign-in failed', error: error.message });
    }
};

module.exports = { sendOtp, signup, login, googleAuth };
