const Delivery = require('../models/Delivery');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const createNotification = require('../utils/createNotification');
const { getIO } = require('../socket');
// Helper: generate a random 4-digit code
const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// @route   POST /api/deliveries/request
const requestDelivery = async (req, res) => {
    try {
        const { itemDescription, pickupLocation, dropLocation, creditsOffered } = req.body;

        if (!itemDescription || !dropLocation || !creditsOffered) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // NEW: Check the requester actually has enough credits to offer
        if (req.user.campusCredits < creditsOffered) {
            return res.status(400).json({
                message: `Insufficient credits. You have ${req.user.campusCredits}, but tried to offer ${creditsOffered}`,
            });
        }

        const delivery = await Delivery.create({
            requestedBy: req.user._id,
            itemDescription,
            pickupLocation: pickupLocation || 'Main Gate',
            dropLocation,
            creditsOffered,
            pickupVerificationCode: generateCode(),
            deliveryVerificationCode: generateCode(),
        });

        res.status(201).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   GET /api/deliveries/available   (unchanged, kept for context)
const getAvailableDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({
            status: 'pending',
            requestedBy: { $ne: req.user._id },
        })
            .populate('requestedBy', 'name hostelName')
            .sort({ createdAt: -1 });

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   POST /api/deliveries/accept/:id   (unchanged, kept for context)
const acceptDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
        if (delivery.status !== 'pending') return res.status(400).json({ message: 'This delivery is no longer available' });
        if (delivery.requestedBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot accept your own request' });
        }

        delivery.deliveryPartner = req.user._id;
        delivery.status = 'accepted';
        await delivery.save();
        getIO().to(delivery.requestedBy.toString()).emit('delivery_updated', { deliveryId: delivery._id });
        await createNotification(
            delivery.requestedBy,
            'Delivery Accepted! 🎉',
            `${req.user.name} is bringing your parcel: ${delivery.itemDescription}`,
            'delivery_accepted',
            delivery._id
        );
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   POST /api/deliveries/pickup/:id
const verifyPickup = async (req, res) => {
    try {
        const { code } = req.body;
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

        if (delivery.deliveryPartner?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not the delivery partner for this order' });
        }

        if (delivery.status !== 'accepted') {
            return res.status(400).json({ message: 'Delivery must be accepted before pickup' });
        }

        if (delivery.pickupVerificationCode !== code) {
            return res.status(400).json({ message: 'Incorrect pickup code' });
        }

        delivery.status = 'picked_up';
        await delivery.save();
        getIO().to(delivery.requestedBy.toString()).emit('delivery_updated', { deliveryId: delivery._id });
        await createNotification(
            delivery.requestedBy,
            'Parcel Picked Up 📦',
            `Your delivery partner has picked up: ${delivery.itemDescription}`,
            'delivery_picked_up',
            delivery._id
        );
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   POST /api/deliveries/deliver/:id
const verifyDelivery = async (req, res) => {
    try {
        const { code } = req.body;
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
        if (delivery.deliveryPartner?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not the delivery partner for this order' });
        }
        if (delivery.status !== 'picked_up') {
            return res.status(400).json({ message: 'Delivery must be picked up first' });
        }
        if (delivery.deliveryVerificationCode !== code) {
            return res.status(400).json({ message: 'Incorrect delivery code' });
        }

        const requester = await User.findById(delivery.requestedBy);
        const partner = await User.findById(delivery.deliveryPartner);

        // Check credits BEFORE marking anything as delivered
        if (requester.campusCredits < delivery.creditsOffered) {
            return res.status(400).json({ message: 'Requester has insufficient credits to complete this transaction' });
        }

        // Now that everything is validated, actually make the changes
        delivery.status = 'delivered';
        await delivery.save();
        await createNotification(
            delivery.requestedBy,
            'Delivery Completed! ✅',
            `Your parcel has been delivered: ${delivery.itemDescription}`,
            'delivery_completed',
            delivery._id
        );

        await createNotification(
            delivery.deliveryPartner,
            'Credits Earned! 💰',
            `You earned ${delivery.creditsOffered} credits for delivering: ${delivery.itemDescription}`,
            'delivery_completed',
            delivery._id
        );
        requester.campusCredits -= delivery.creditsOffered;
        partner.campusCredits += delivery.creditsOffered;
        await requester.save();
        await partner.save();

        await Transaction.create({
            user: requester._id,
            delivery: delivery._id,
            type: 'spent',
            amount: delivery.creditsOffered,
            description: `Delivery: ${delivery.itemDescription}`,
        });

        await Transaction.create({
            user: partner._id,
            delivery: delivery._id,
            type: 'earned',
            amount: delivery.creditsOffered,
            description: `Delivered: ${delivery.itemDescription}`,
        });
        getIO().to(delivery.requestedBy.toString()).emit('delivery_updated', { deliveryId: delivery._id });
        getIO().to(delivery.deliveryPartner.toString()).emit('delivery_updated', { deliveryId: delivery._id });
        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// @route   GET /api/deliveries/my-requests
const getMyRequests = async (req, res) => {
    try {
        const deliveries = await Delivery.find({ requestedBy: req.user._id })
            .populate('deliveryPartner', 'name phone')
            .sort({ createdAt: -1 });

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   GET /api/deliveries/my-accepted
const getMyAcceptedDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({ deliveryPartner: req.user._id })
            .populate('requestedBy', 'name phone hostelName')
            .sort({ createdAt: -1 });

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// @route   POST /api/deliveries/rate/:id
const rateDelivery = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

        if (delivery.requestedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the requester can rate this delivery' });
        }

        if (delivery.status !== 'delivered') {
            return res.status(400).json({ message: 'You can only rate completed deliveries' });
        }

        if (delivery.rating !== null) {
            return res.status(400).json({ message: 'You have already rated this delivery' });
        }

        delivery.rating = rating;
        delivery.ratingComment = comment || null;
        await delivery.save();

        // Update the delivery partner's running average rating
        const partner = await User.findById(delivery.deliveryPartner);
        const newTotal = partner.totalRatings + 1;
        const newAverage = ((partner.averageRating * partner.totalRatings) + rating) / newTotal;

        partner.averageRating = newAverage;
        partner.totalRatings = newTotal;
        await partner.save();

        res.status(200).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    requestDelivery,
    getAvailableDeliveries,
    acceptDelivery,
    verifyPickup,
    verifyDelivery,
    getMyRequests,
    getMyAcceptedDeliveries,
    rateDelivery, // add this
};

