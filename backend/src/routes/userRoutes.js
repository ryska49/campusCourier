const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getCredits, getTransactions, getNotifications, markNotificationRead, updatePushToken } = require('../controllers/userController');

router.patch('/push-token', protect, updatePushToken);
router.patch('/notifications/:id/read', protect, markNotificationRead);
router.patch('/profile', protect, updateProfile);


router.get('/notifications', protect, getNotifications);

router.get('/credits', protect, getCredits);
router.get('/transactions', protect, getTransactions);
router.get('/profile', protect, getProfile);

module.exports = router; 