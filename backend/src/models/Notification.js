const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true, // who this notification is FOR
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['delivery_accepted', 'delivery_picked_up', 'delivery_completed', 'general'],
            default: 'general',
        },
        relatedDelivery: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery',
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Notification', notificationSchema);