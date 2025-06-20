const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

module.exports = async function(req, res, next) { // Made the function async
  // Get token from header
  let token;
  const authHeader = req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token and fetch user
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database using the ID from the token
    const user = await User.findById(decoded.user.id).select('-password');

    if (!user) {
        return res.status(404).json({ msg: 'User not found' });
    }

    // Attach the full user object to req.user
    req.user = user;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
