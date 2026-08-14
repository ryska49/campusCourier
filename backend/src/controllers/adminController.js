const User = require('../models/User');
const Delivery = require('../models/Delivery');

// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   PATCH /api/admin/users/:id/credits
const adjustUserCredits = async (req, res) => {
    try {
        const { amount } = req.body; // can be positive or negative
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.campusCredits += Number(amount);
        if (user.campusCredits < 0) user.campusCredits = 0; // never let it go negative from admin action
        await user.save();

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getAllUsers, deleteUser, adjustUserCredits };