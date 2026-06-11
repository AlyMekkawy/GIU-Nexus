const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  startInterview,
  respondToInterview,
  getInterviewSession,
} = require('../controllers/interviewController');

// Start a new interview session for a job
router.post('/jobs/:jobId/interview', protect, authorize('jobSeeker'), startInterview);

// Submit an answer and get feedback + next question
router.post('/interview/:sessionId/respond', protect, authorize('jobSeeker'), respondToInterview);

// Fetch full session (for resume / results page)
router.get('/interview/:sessionId', protect, authorize('jobSeeker'), getInterviewSession);

module.exports = router;
