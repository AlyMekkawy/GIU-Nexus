const express = require("express");
const { getJobs, updateJob } = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public: GET /api/v1/jobs
router.get("/", getJobs);

// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, updateJob);

module.exports = router;
