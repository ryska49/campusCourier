const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');
const { getAllUsers, deleteUser, adjustUserCredits } = require('../controllers/adminController');

router.get('/users', protect, isAdmin, getAllUsers);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.patch('/users/:id/credits', protect, isAdmin, adjustUserCredits);

module.exports = router;