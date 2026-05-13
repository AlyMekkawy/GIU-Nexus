const express = require('express');
const router = express.Router();

const { getMyApplications, updateApplicationStatus, getAllApplications } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @openapi
 * /api/v1/applications/my:
 *   get:
 *     summary: List my applications
 *     description: Job seeker-only route returning applications submitted by the logged-in user.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Applications returned successfully
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
 *                     example:
 *                       _id: "64b8f3d6c1a2b3c4d5e6f789"
 *                       status: "pending"
 *                       appliedAt: "2026-04-01T10:15:00.000Z"
 *                       job:
 *                         _id: "64b8f3d6c1a2b3c4d5e6f780"
 *                         title: "Backend Intern"
 *                         company: "TechCo"
 *                         type: "internship"
 *                         status: "open"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 */
router.get('/my', protect, authorize('jobSeeker'), getMyApplications);

/**
 * @openapi
 * /api/v1/applications/{id}/status:
 *   patch:
 *     summary: Update application status
 *     description: Recruiter-only route. Recruiter must own the job the application belongs to. Updates the review status of an application.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             status: shortlisted
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - shortlisted
 *                   - rejected
 *                 description: "Allowed values: pending, shortlisted, rejected."
 *                 example: shortlisted
 *     responses:
 *       200:
 *         description: Application status updated
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
 *                       example: "665fa1112c1e4a0012b34569"
 *                     status:
 *                       type: string
 *                       example: "shortlisted"
 *       400:
 *         description: Invalid status or request
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Recruiter role required or recruiter does not own the related job.
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
 *                   example: "Not authorised to update this application"
 */
router.patch('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);

/**
 * @openapi
 * /api/v1/applications:
 *   get:
 *     summary: List all applications
 *     description: Admin-only route. Returns a paginated list of all applications on the platform.
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 20
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: Applications returned successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               total: 120
 *               page: 1
 *               applications:
 *                 - _id: "..."
 *                   user:
 *                     _id: "..."
 *                     name: "..."
 *                     email: "..."
 *                   job:
 *                     _id: "..."
 *                     title: "..."
 *                     company: "..."
 *                   status: "..."
 *                   appliedAt: "..."
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 120
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "..."
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "..."
 *                           name:
 *                             type: string
 *                             example: "..."
 *                           email:
 *                             type: string
 *                             example: "..."
 *                       job:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "..."
 *                           title:
 *                             type: string
 *                             example: "..."
 *                           company:
 *                             type: string
 *                             example: "..."
 *                       status:
 *                         type: string
 *                         example: "..."
 *                       appliedAt:
 *                         type: string
 *                         example: "..."
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 */
router.get('/', protect, authorize('admin'), getAllApplications);


module.exports = router;
