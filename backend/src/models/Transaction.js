const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        delivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery',
            default: null, // some transactions might not be tied to a delivery (e.g. admin bonus)
        },
        type: {
            type: String,
            enum: ['earned', 'spent'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            trim: true, // e.g. "Delivered parcel for Rahul" or "Requested delivery to Hostel B"
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Transaction', transactionSchema);