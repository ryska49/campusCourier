const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        filedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        relatedDelivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery',
            default: null,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved'],
            default: 'open',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Complaint', complaintSchema);