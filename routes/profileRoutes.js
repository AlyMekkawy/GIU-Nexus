const express = require('express');
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const router = express.Router();

// GET /api/v1/profile - private (any authenticated user)
router.get('/', protect, getProfile);

// PATCH /api/v1/profile - private (any authenticated user)
router.patch('/', protect, updateProfile);

// PATCH /api/v1/profile/change-password - private (any authenticated user)
router.patch('/change-password', protect, changePassword);

module.exports = router;