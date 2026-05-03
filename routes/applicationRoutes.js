const express = require('express');
const router = express.Router();
const { getAllApplications } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAllApplications);

module.exports = router;
