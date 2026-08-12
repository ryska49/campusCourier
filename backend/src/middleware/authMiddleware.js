const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        // 1. Get the Authorization header, e.g. "Bearer eyJhbGciOi..."
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // 2. Extract just the token part (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        // 3. Verify the token's signature and decode its payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Fetch the actual user from DB (in case they were deleted after the token was issued)
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        // 5. Attach user to the request object for use in later controllers
        req.user = user;

        // 6. Let the request continue to the actual route handler
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
};

module.exports = protect;