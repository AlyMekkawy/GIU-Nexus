const express = require("express");


const { getJobs, createJob, getJobById, deleteJob, updateJob, getRecommendedJobs, getSavedJobs, getMyJobs, getJobApplicants, toggleSaveJob, applyToJob } = require("../controllers/jobController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/v1/jobs:
 *   get:
 *     summary: List job posts
 *     description: Returns a paginated, filterable list of job posts.
 *     tags:
 *       - Jobs
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword for job title, company, or description. Alias of `search`.
 *         example: react
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for job title, company, or description.
 *         example: react
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by job location.
 *         example: Cairo
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by job type.
 *         example: internship
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by job category.
 *         example: Backend
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by job status.
 *         example: open
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination.
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page size for pagination.
 *         example: 10
 *     responses:
 *       200:
 *         description: Returns a paginated, filterable list of all job postings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64b8f3d6c1a2b3c4d5e6f789"
 *                       title:
 *                         type: string
 *                         example: "Backend Intern"
 *                       company:
 *                         type: string
 *                         example: "TechCo"
 *                       location:
 *                         type: string
 *                         example: "Cairo"
 *                       type:
 *                         type: string
 *                         example: "internship"
 *                       category:
 *                         type: string
 *                         example: "Backend"
 *                       status:
 *                         type: string
 *                         example: "open"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-03T12:00:00.000Z"
 */
// Public: GET /api/v1/jobs
router.get("/", getJobs);

// Recruiter only: POST /api/v1/jobs
router.post("/", protect, authorize("recruiter"), createJob);

// Private - Job Seeker only: GET /api/v1/jobs/recommended
// Must come BEFORE the /:id route to avoid conflict
router.get("/recommended", protect, authorize('jobSeeker'), getRecommendedJobs);

// Private - Job Seeker only: GET /api/v1/jobs/saved
// Must come BEFORE the /:id route to avoid conflict
router.get("/saved", protect, authorize("jobSeeker"), getSavedJobs);

// Private - Recruiter only: GET /api/v1/jobs/my-jobs
// Must come BEFORE the /:id route to avoid conflict
router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);

// Public: GET /api/v1/jobs/:id
router.get("/:id", getJobById);

// Recruiter (owner) or Admin: DELETE /api/v1/jobs/:id
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, updateJob);

// Recruiter only: GET /api/v1/jobs/:jobId/applicants
router.get("/:jobId/applicants", protect, authorize("recruiter"), getJobApplicants);

// Job Seeker only: POST /api/v1/jobs/:id/save
router.post("/:id/save", protect, authorize("jobSeeker"), toggleSaveJob);

// Job Seeker only: POST /api/v1/jobs/:jobId/apply
router.post("/:jobId/apply", protect, authorize("jobSeeker"), applyToJob);

module.exports = router;
