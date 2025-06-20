const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  // Assuming the user object has a 'role' property populated by the auth middleware
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Not authorized as an admin' });
  }
};

// @route GET /api/users
// @desc Get all users (Admin only)
// @access Private (Admin)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route PUT /api/users/:id/role
// @desc Update user role (Admin only)
// @access Private (Admin)
router.put('/:id/role', auth, isAdmin, async (req, res) => {
  const { role } = req.body;

  // Validate the provided role
  const validRoles = ['Admin', 'Developer', 'Submitter'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ msg: 'Invalid role provided' });
  }

  try {
    const user = await User.findById(req.params.id).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
