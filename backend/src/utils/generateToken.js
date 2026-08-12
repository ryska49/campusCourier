const jwt = require('jsonwebtoken');
const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role: role },   // payload: data stored inside the token
        process.env.JWT_SECRET,       // secret key used to sign/stamp the token
        { expiresIn: '30d' }          // token becomes invalid after 30 days
    );
};
module.exports = generateToken;