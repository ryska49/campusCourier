const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Complaint = require('../models/Complaint'); // add import at top

// @route   GET /api/admin/complaints
const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('filedBy', 'name email')
            .populate('relatedDelivery', 'itemDescription')
            .sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   PATCH /api/admin/complaints/:id
const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = status;
        await complaint.save();
        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

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

// @route   GET /api/admin/deliveries
const getAllDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find()
        .populate('requestedBy', 'name email')
        .populate('deliveryPartner', 'name email')
        .sort({ createdAt: -1 });
        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   PATCH /api/admin/deliveries/:id/cancel
const cancelDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
        
        if (delivery.status === 'delivered') {
            return res.status(400).json({ message: 'Cannot cancel a completed delivery' });
        }
        
        delivery.status = 'cancelled';
        await delivery.save();
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getAllUsers, deleteUser, adjustUserCredits, getAllDeliveries, cancelDelivery, getAllComplaints, updateComplaintStatus };