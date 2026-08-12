const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
    {
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId, // stores a reference (ID) to a User
            ref: 'User',                          // tells Mongoose which model this ID points to
            required: true,
        },
        deliveryPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // null until someone accepts the delivery
        },
        itemDescription: {
            type: String,
            required: true,
            trim: true,
        },
        pickupLocation: {
            type: String,
            default: 'Main Gate', // most deliveries start at the gate
        },
        dropLocation: {
            type: String,
            required: true, // e.g. "Hostel B, Room 214"
        },
        creditsOffered: {
            type: Number,
            required: true,
            min: 1, // must offer at least 1 credit
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'picked_up', 'delivered', 'cancelled'],
            default: 'pending',
        },
        pickupVerificationCode: {
            type: String, // a short code/OTP shown to confirm pickup happened
        },
        deliveryVerificationCode: {
            type: String, // a short code shown to confirm delivery happened
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },
        ratingComment: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Delivery', deliverySchema);