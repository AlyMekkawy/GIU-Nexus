const express = require('express');
const { protect } = require('../middleware/auth');
const { getProfile } = require('../controllers/profileController');
const router = express.Router();

// GET /api/v1/profile - private (any authenticated user)
router.get('/', protect, getProfile);

module.exports = router;