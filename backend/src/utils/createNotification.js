const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (userId, title, message, type, deliveryId = null) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedDelivery: deliveryId,
        });

        // Also send a real push notification, if this user has a registered device
        const user = await User.findById(userId);
        if (user?.pushToken) {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    to: user.pushToken,
                    title,
                    body: message,
                    sound: 'default',
                }),
            });
        }
    } catch (error) {
        console.log('Error creating notification:', error.message);
    }
};

module.exports = createNotification;
