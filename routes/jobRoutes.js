const express = require("express");
const { getJobs } = require("../controllers/jobController");

const router = express.Router();

// Public: GET /api/v1/jobs
router.get("/", getJobs);

module.exports = router;
