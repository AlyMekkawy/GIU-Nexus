const express = require('express');
const router = express.Router();
const { getMyApplications, updateApplicationStatus } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, authorize('jobSeeker'), getMyApplications);
router.patch('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);

module.exports = router;