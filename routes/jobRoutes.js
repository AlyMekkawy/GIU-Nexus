const express = require("express");
const { getJobs, deleteJob } = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public: GET /api/v1/jobs
router.get("/", getJobs);

// Recruiter (owner) or Admin: DELETE /api/v1/jobs/:id
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

module.exports = router;
