const express = require("express");

const { getJobs, createJob, getJobById, deleteJob, updateJob, getRecommendedJobs } = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public: GET /api/v1/jobs
router.get("/", getJobs);

// Recruiter only: POST /api/v1/jobs
router.post("/", protect, authorize("recruiter"), createJob);

// Private - Job Seeker only: GET /api/v1/jobs/recommended
// Must come BEFORE the /:id route to avoid conflict
router.get("/recommended", protect, authorize('jobSeeker'), getRecommendedJobs);

// Public: GET /api/v1/jobs/:id
router.get("/:id", getJobById);

// Recruiter (owner) or Admin: DELETE /api/v1/jobs/:id
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, updateJob);

module.exports = router;
