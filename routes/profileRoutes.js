const express = require('express');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword, extractSkills } = require('../controllers/profileController');
const router = express.Router();

// GET /api/v1/profile - private (any authenticated user)
router.get('/', protect, getProfile);

// PATCH /api/v1/profile - private (any authenticated user)
router.patch('/', protect, upload.single('profilePicture'), updateProfile);

// PATCH /api/v1/profile/change-password - private (any authenticated user)
router.patch('/change-password', protect, changePassword);

// POST /api/v1/profile/extract-skills - private (jobSeeker only)
router.post('/extract-skills', protect, authorize('jobSeeker'), extractSkills);

module.exports = router;