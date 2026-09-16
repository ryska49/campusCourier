const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false, // optional — Google OAuth users have no password
    },
    authProvider: {
        type: String,
        enum: ['email', 'google'],
        default: 'email',
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student',
    },
    campusCredits: {
        type: Number,
        default: 20,
    },
    hostelName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    pushToken: {
        type: String,
        default: null,
    },
},
    {
        timestamps: true,
})

module.exports = mongoose.model('User', userSchema);