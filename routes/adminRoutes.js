const express = require('express');
const { getPlatformStats } = require('../controllers/adminController.js');
const { protect, restrictTo } = require('../middleware/auth.js');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/stats', getPlatformStats);

module.exports = router;