const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'zenthra_super_secret_key_2026';

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, empId, department, designation, role, password } = req.body;

    let userExists = await User.findOne({ $or: [{ email }, { empId }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with email or employee ID already exists' });
    }

    const user = new User({ fullName, email, empId, department, designation, role, password });
    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, fullName, email, role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { empId, email, role } = req.body;
    const identifier = (empId || email || '').trim();
    if (!identifier) {
      return res.status(400).json({ message: 'Employee ID or email is required' });
    }

    // We can allow login via email or empId, assuming frontend sends empId field
    let user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { empId: identifier },
        { empId: identifier.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }


    // Optional: Verify role matches if strictly required
    if (role && user.role !== role) {
      return res.status(401).json({ message: 'Unauthorized role access' });
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
