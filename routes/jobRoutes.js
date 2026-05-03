const express = require("express");
const { getJobs, updateJob, getRecommendedJobs } = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public: GET /api/v1/jobs
router.get("/", getJobs);

// Private - Job Seeker only: GET /api/v1/jobs/recommended
// Must come BEFORE the /:id route to avoid conflict
router.get("/recommended", protect, authorize('jobSeeker'), getRecommendedJobs);

// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, updateJob);

module.exports = router;
