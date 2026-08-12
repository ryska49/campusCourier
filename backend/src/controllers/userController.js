const User = require('../models/User');
const Notification = require('../models/Notification');

const Transaction = require('../models/Transaction');
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
    // req.user was already fetched and attached by our authMiddleware
    res.status(200).json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        hostelName: req.user.hostelName,
        phone: req.user.phone,
        campusCredits: req.user.campusCredits,
    });
};

// @route   PATCH /api/users/profile
const updateProfile = async (req, res) => {
    try {
        const { name, hostelName, phone } = req.body;

        const user = await User.findById(req.user._id);

        // Only update fields that were actually provided
        if (name) user.name = name;
        if (hostelName) user.hostelName = hostelName;
        if (phone) user.phone = phone;

        const updatedUser = await user.save();

        res.status(200).json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            hostelName: updatedUser.hostelName,
            phone: updatedUser.phone,
            campusCredits: updatedUser.campusCredits,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   GET /api/users/credits
const getCredits = async (req, res) => {
    res.status(200).json({ campusCredits: req.user.campusCredits });
};

// @route   GET /api/users/transactions
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('delivery', 'itemDescription status')
            .sort({ createdAt: -1 });

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   GET /api/users/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   PATCH /api/users/notifications/:id/read
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        
        await notification.save();
        
        res.status(200).json(notification);

    } catch (error) {
        
        res.status(500).json({ message: 'Server error', error: error.message });
    
    }
};
// @route   PATCH /api/users/push-token
const updatePushToken = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const user = await User.findById(req.user._id);
        user.pushToken = pushToken;
        await user.save();
        res.status(200).json({ message: 'Push token saved' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getProfile, updateProfile, getCredits, getTransactions, getNotifications, markNotificationRead, updatePushToken };
