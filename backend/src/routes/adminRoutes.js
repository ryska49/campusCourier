const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');
const {
    getAllUsers,
    deleteUser,
    adjustUserCredits,
    getAllDeliveries,
    cancelDelivery, 
    getAllComplaints,
    updateComplaintStatus,
} = require('../controllers/adminController');

router.get('/users', protect, isAdmin, getAllUsers);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.patch('/users/:id/credits', protect, isAdmin, adjustUserCredits);

router.get('/deliveries', protect, isAdmin, getAllDeliveries);
router.patch('/deliveries/:id/cancel', protect, isAdmin, cancelDelivery);

router.get('/complaints', protect, isAdmin, getAllComplaints);
router.patch('/complaints/:id', protect, isAdmin, updateComplaintStatus);

module.exports = router;