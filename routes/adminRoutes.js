const express = require('express');
const { getPlatformStats } = require('../controllers/adminController.js');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/stats', getPlatformStats);

module.exports = router;