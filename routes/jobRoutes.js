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

/**
 * @openapi
 * /api/v1/jobs:
 *   post:
 *     summary: Create a job post
 *     description: Recruiter-only route to create a new job posting.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - company
 *               - location
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Backend Intern"
 *               company:
 *                 type: string
 *                 example: "TechCo"
 *               location:
 *                 type: string
 *                 example: "Cairo"
 *               type:
 *                 type: string
 *                 example: "internship"
 *               description:
 *                 type: string
 *                 example: "Work on APIs and integrations."
 *               category:
 *                 type: string
 *                 example: "Backend"
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Invalid job data
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required.
 */
// Recruiter only: POST /api/v1/jobs
router.post("/", protect, authorize("recruiter"), createJob);

/**
 * @openapi
 * /api/v1/jobs/recommended:
 *   get:
 *     summary: Get recommended jobs
 *     description: Job seeker-only route returning AI-recommended jobs for the logged-in user.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended jobs returned successfully
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 */
// Private - Job Seeker only: GET /api/v1/jobs/recommended
// Must come BEFORE the /:id route to avoid conflict
router.get("/recommended", protect, authorize('jobSeeker'), getRecommendedJobs);

/**
 * @openapi
 * /api/v1/jobs/saved:
 *   get:
 *     summary: Get saved jobs
 *     description: Job seeker-only route returning jobs saved by the logged-in user.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved jobs returned successfully
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 */
// Private - Job Seeker only: GET /api/v1/jobs/saved
// Must come BEFORE the /:id route to avoid conflict
router.get("/saved", protect, authorize("jobSeeker"), getSavedJobs);

/**
 * @openapi
 * /api/v1/jobs/my-jobs:
 *   get:
 *     summary: List my jobs
 *     description: Recruiter-only route returning jobs created by the logged-in recruiter.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recruiter jobs returned successfully
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required.
 */
// Private - Recruiter only: GET /api/v1/jobs/my-jobs
// Must come BEFORE the /:id route to avoid conflict
router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);

/**
 * @openapi
 * /api/v1/jobs/{id}:
 *   get:
 *     summary: Get job by id
 *     description: Public route returning a single job post by id.
 *     tags:
 *       - Jobs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job id
 *     responses:
 *       200:
 *         description: Job returned successfully
 *       400:
 *         description: Invalid job id format
 *       404:
 *         description: Job not found
 */
// Public: GET /api/v1/jobs/:id
router.get("/:id", getJobById);

/**
 * @openapi
 * /api/v1/jobs/{id}:
 *   delete:
 *     summary: Delete job
 *     description: Recruiter (owner) or admin route to delete a job post.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job id
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter owner or admin role required.
 *       404:
 *         description: Job not found
 */
// Recruiter (owner) or Admin: DELETE /api/v1/jobs/:id
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

/**
 * @openapi
 * /api/v1/jobs/{id}:
 *   patch:
 *     summary: Update job
 *     description: Recruiter-only route to update a job post.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Invalid job data
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required.
 */
// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, updateJob);

/**
 * @openapi
 * /api/v1/jobs/{jobId}/applicants:
 *   get:
 *     summary: List job applicants
 *     description: Recruiter-only route returning applicants for a specific job post.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job id
 *     responses:
 *       200:
 *         description: Applicants returned successfully
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required.
 *       404:
 *         description: Job not found
 */
// Recruiter only: GET /api/v1/jobs/:jobId/applicants
router.get("/:jobId/applicants", protect, authorize("recruiter"), getJobApplicants);

/**
 * @openapi
 * /api/v1/jobs/{id}/save:
 *   post:
 *     summary: Toggle save job
 *     description: Job seeker-only route to save or unsave a job post.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job id
 *     responses:
 *       200:
 *         description: Save toggled successfully
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 *       404:
 *         description: Job not found
 */
// Job Seeker only: POST /api/v1/jobs/:id/save
router.post("/:id/save", protect, authorize("jobSeeker"), toggleSaveJob);

/**
 * @openapi
 * /api/v1/jobs/{jobId}/apply:
 *   post:
 *     summary: Apply to a job
 *     description: Job seeker-only route to apply to a job post.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job id
 *     responses:
 *       200:
 *         description: Application submitted successfully
 *       400:
 *         description: Invalid application request
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 *       404:
 *         description: Job not found
 */
// Job Seeker only: POST /api/v1/jobs/:jobId/apply
router.post("/:jobId/apply", protect, authorize("jobSeeker"), applyToJob);

module.exports = router;
