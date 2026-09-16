const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    code: {
        type: String,
        required: true, // 6-digit string
    },
    expiresAt: {
        type: Date,
        required: true, // 10 minutes from creation
    },
    used: {
        type: Boolean,
        default: false, // becomes true once verified — prevents reuse
    },
});

// MongoDB TTL index — automatically deletes expired OTP documents from DB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
