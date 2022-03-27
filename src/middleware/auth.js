const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer', '').trim();
        const decoded = jwt.verify(token, process.env.secretKey);

        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token }); // Find the user who has this token in his tokens array

        if (!user) throw new Error(); // If no such user exists

        req.token = token;
        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({ error: 'Please authenticate' });
    }
}

module.exports = auth;