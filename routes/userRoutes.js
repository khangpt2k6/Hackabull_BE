const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user preferences
router.patch('/:id/preferences', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { preferences: req.body },
      { new: true }
    ).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add to user history
router.post('/:id/history', async (req, res) => {
  try {
    const { type, data } = req.body;
    let updateField = {};
    
    if (type === 'search') {
      updateField = { $push: { 'history.searches': { query: data } } };
    } else if (type === 'view') {
      updateField = { $push: { 'history.viewedProducts': { product: data } } };
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateField,
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;