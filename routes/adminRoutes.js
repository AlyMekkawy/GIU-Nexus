const express = require('express');
const { getPlatformStats } = require('../controllers/adminController.js');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

/**
 * @openapi
 * /api/v1/admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Admin-only route returning aggregated platform metrics.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   description: Aggregated counts and metrics for the platform.
 *                   example:
 *                     usersByRole:
 *                       jobSeeker: 120
 *                       recruiter: 34
 *                     jobsByStatus:
 *                       open: 58
 *                       closed: 21
 *                     appsByStatus:
 *                       pending: 200
 *                       shortlisted: 45
 *                       rejected: 30
 *                     topJobs:
 *                       - _id: "64b8f3d6c1a2b3c4d5e6f789"
 *                         title: "Backend Intern"
 *                         company: "TechCo"
 *                         applicationCount: 18
 *                       - _id: "64b8f3d6c1a2b3c4d5e6f780"
 *                         title: "Frontend Intern"
 *                         company: "DevLabs"
 *                         applicationCount: 12
 *                     appsPerWeek:
 *                       - week: "2026-14"
 *                         count: 4
 *                       - week: "2026-15"
 *                         count: 4
 *                       - week: "2026-18"
 *                         count: 1
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 */
router.get('/stats', getPlatformStats);

module.exports = router;