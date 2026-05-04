const express = require("express");

const { getJobs, deleteJob, updateJob, getRecommendedJobs, getJobApplicants } = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public: GET /api/v1/jobs
router.get("/", getJobs);

// Recruiter (owner) or Admin: DELETE /api/v1/jobs/:id
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);
// Private - Job Seeker only: GET /api/v1/jobs/recommended
// Must come BEFORE the /:id route to avoid conflict
router.get("/recommended", protect, authorize('jobSeeker'), getRecommendedJobs);

// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, updateJob);

// Recruiter only: GET /api/v1/jobs/:jobId/applicants
router.get("/:jobId/applicants", protect, authorize("recruiter"), getJobApplicants);

module.exports = router;
