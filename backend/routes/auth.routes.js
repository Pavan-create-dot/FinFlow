const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
    });

    const safeUser = user.toJSON();
    delete safeUser.passwordHash;

    const tokens = generateTokens(safeUser);
    res.status(201).json({ user: safeUser, ...tokens });
  } catch (error) {
    next(error);
  }
});

// User Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = user.toJSON();
    delete safeUser.passwordHash;

    const tokens = generateTokens(safeUser);
    res.json({ user: safeUser, ...tokens });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
