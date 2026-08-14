const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { requestDelivery, getAvailableDeliveries, acceptDelivery, verifyPickup, verifyDelivery, getMyRequests, getMyAcceptedDeliveries, rateDelivery, fileComplaint } = require('../controllers/deliveryController');

router.post('/rate/:id', protect, rateDelivery);
router.post('/request', protect, requestDelivery);
router.post('/accept/:id', protect, acceptDelivery);
router.post('/pickup/:id', protect, verifyPickup);
router.post('/deliver/:id', protect, verifyDelivery);
router.get('/my-accepted', protect, getMyAcceptedDeliveries);
router.get('/my-requests', protect, getMyRequests);
router.get('/available', protect, getAvailableDeliveries);
router.post('/complaint', protect, fileComplaint);

module.exports = router;