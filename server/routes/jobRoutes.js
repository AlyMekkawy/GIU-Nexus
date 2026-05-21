const express = require("express");


const { getJobs, createJob, getJobById, deleteJob, updateJob, getRecommendedJobs, getSavedJobs, getMyJobs, getJobApplicants, toggleSaveJob, applyToJob, getCoverLetterSuggestion } = require("../controllers/jobController");

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
 * /api/v1/jobs/{id}/save:
 *   post:
 *     summary: Toggle saved job
 *     description: Job seeker-only route. Toggles the saved state for a job. If already saved, it is removed; if not saved, it is added. Only open jobs can be saved.
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
 *         description: Saved state toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job saved"
 *                 saved:
 *                   type: boolean
 *                   example: true
 *             examples:
 *               saved:
 *                 summary: Job added to saved list
 *                 value:
 *                   success: true
 *                   message: "Job saved"
 *                   saved: true
 *               removed:
 *                 summary: Job removed from saved list
 *                 value:
 *                   success: true
 *                   message: "Job removed from saved"
 *                   saved: false
 *       400:
 *         description: Invalid request or job cannot be saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cannot save a closed job"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 *       404:
 *         description: Job not found
 */
// Recruiter only: POST /api/v1/jobs
router.post("/", protect, authorize("recruiter"), createJob);

/**
 * @openapi
 * /api/v1/jobs/recommended:
 *   get:
 *     summary: Get recommended jobs
 *     description: Job seeker-only route returning jobs ranked by cosine similarity between the user's skills and job requirements, computed via HuggingFace sentence embeddings.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended jobs returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 jobs:
 *                   type: array
 *                   description: Jobs sorted by similarity score, highest first.
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665f9a7b2c1e4a0012b34567"
 *                       title:
 *                         type: string
 *                         example: "Backend Intern"
 *                       company:
 *                         type: string
 *                         example: "TechCo"
 *                       category:
 *                         type: string
 *                         example: "Backend"
 *                       score:
 *                         type: number
 *                         example: 0.87
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
 *     description: Job seeker-only route returning all jobs the logged-in user has saved/bookmarked.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved jobs returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665f9a7b2c1e4a0012b34567"
 *                       title:
 *                         type: string
 *                         example: "Backend Intern"
 *                       company:
 *                         type: string
 *                         example: "TechCo"
 *                       type:
 *                         type: string
 *                         example: "internship"
 *                       status:
 *                         type: string
 *                         example: "open"
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
 *     description: Recruiter-only route returning all job posts created by the logged-in recruiter.
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recruiter jobs returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665fa1112c1e4a0012b34569"
 *                       title:
 *                         type: string
 *                         example: "Backend Intern"
 *                       status:
 *                         type: string
 *                         example: "open"
 *                       type:
 *                         type: string
 *                         example: "internship"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-07T12:00:00.000Z"
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
 *     description: Public route returning a single job post by its ID, with recruiter info populated.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 job:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "665f9a7b2c1e4a0012b34567"
 *                     title:
 *                       type: string
 *                       example: "Backend Intern"
 *                     description:
 *                       type: string
 *                       example: "Work on APIs and integrations."
 *                     requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Node.js", "MongoDB", "REST APIs"]
 *                     category:
 *                       type: string
 *                       example: "Backend"
 *                     status:
 *                       type: string
 *                       example: "open"
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Recruiter Name"
 *                         email:
 *                           type: string
 *                           example: "recruiter@example.com"
 *       400:
 *         description: Invalid job id format
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Job not found"
 */
// Public: GET /api/v1/jobs/:id
router.get("/:id", getJobById);

/**
 * @openapi
 * /api/v1/jobs/{id}:
 *   delete:
 *     summary: Delete job
 *     description: Recruiter owner or admin route. Permanently deletes a job post.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Job deleted"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter owner or admin role required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not authorised to delete this job"
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
 *     description: Recruiter-only route to update a job post. Recruiter must own the job. If description is changed, the AI re-classifies the category automatically.
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
 *             description: All fields are optional.
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior Backend Engineer"
 *               company:
 *                 type: string
 *                 example: "TechCo"
 *               description:
 *                 type: string
 *                 example: "Build scalable APIs and backend services."
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Node.js", "MongoDB", "System Design"]
 *               location:
 *                 type: string
 *                 enum: ["City", "Remote"]
 *                 example: "Remote"
 *               type:
 *                 type: string
 *                 enum: ["full-time", "part-time", "internship"]
 *                 example: "full-time"
 *               salary:
 *                 type: number
 *                 example: 20000
 *               totalSlots:
 *                 type: number
 *                 example: 2
 *               status:
 *                 type: string
 *                 enum: ["open", "closed"]
 *                 example: "closed"
 *             example:
 *               title: "Senior Backend Engineer"
 *               status: "closed"
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 job:
 *                   type: object
 *                   description: Updated job fields.
 *       400:
 *         description: Invalid job data
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required or recruiter does not own this job.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Not authorised to edit this job"
 */
// Recruiter only: PATCH /api/v1/jobs/:id
router.patch("/:id", protect, authorize("recruiter", "admin"), updateJob);

/**
 * @openapi
 * /api/v1/jobs/{jobId}/applicants:
 *   get:
 *     summary: List job applicants
 *     description: Recruiter-only route. Recruiter must own the job. Returns all applications for a specific job, with full applicant details populated.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665fa1112c1e4a0012b34569"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       coverLetter:
 *                         type: string
 *                         example: "I am excited to apply for this role."
 *                       appliedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-07T12:00:00.000Z"
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "665f9a7b2c1e4a0012b34567"
 *                           name:
 *                             type: string
 *                             example: "Sara Ahmed"
 *                           email:
 *                             type: string
 *                             example: "sara@example.com"
 *                           skills:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["React", "Node.js"]
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required or recruiter does not own this job.
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
 *     description: Job seeker-only route. Submits an application to a job. Duplicate applications are rejected at the database level via a unique compound index.
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 example: "I am excited to apply because my backend experience matches this role."
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 application:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "665f9c9a2c1e4a0012b34568"
 *                     user:
 *                       type: string
 *                       example: "<userId>"
 *                     job:
 *                       type: string
 *                       example: "<jobId>"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     appliedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-07T12:00:00.000Z"
 *       400:
 *         description: Invalid application request or duplicate application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You have already applied to this job"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Job not found"
 */
// Job Seeker only: POST /api/v1/jobs/:jobId/apply
router.post("/:jobId/apply", protect, authorize("jobSeeker"), applyToJob);

/**
 * @openapi
 * /api/v1/jobs/{id}/cover-letter-suggestion:
 *   post:
 *     summary: Generate cover letter suggestion
 *     description: Job seeker-only route that generates a draft cover letter using the student's bio and the selected job's details.
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
 *         description: Cover letter generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 coverLetter:
 *                   type: string
 *                   example: "Dear Hiring Manager, ..."
 *       400:
 *         description: Invalid request (missing bio or job description)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Student bio is required"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 *       404:
 *         description: Job not found
 *       503:
 *         description: Hugging Face generation failed or timed out
 */
// Job Seeker only: POST /api/v1/jobs/:id/cover-letter-suggestion
router.post("/:id/cover-letter-suggestion", protect, authorize("jobSeeker"), getCoverLetterSuggestion);



module.exports = router;
