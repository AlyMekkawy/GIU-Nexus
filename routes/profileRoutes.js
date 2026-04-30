const express = require('express');
const { protect } = require('../middleware/auth');
const { getProfile } = require('../controllers/profileController');
const router = express.Router();

// GET /api/v1/profile - private (any authenticated user)
router.get('/', protect, getProfile);

const { updateProfile } = require('../controllers/profileController');
// PATCH /api/v1/profile - private (any authenticated user)
router.patch('/', requireAuthDemo, updateProfile);

const {changePassword} = require('../controllers/profileController');
// PATCH /api/v1/profile/change-password - private (any authenticated user)
router.patch('/change-password', requireAuthDemo, changePassword);
module.exports = router;