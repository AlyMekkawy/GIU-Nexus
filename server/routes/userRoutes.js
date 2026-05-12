const express = require('express');
const router = express.Router();

//getting user from id
const {getUserByID, deleteUser} = require("../controllers/userController");
const { getUsers, updateUserStatus } = require('../controllers/userController');
const {protect, authorize} = require("../middleware/auth");

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by id
 *     description: Admin-only route returning a single user by ID.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       200:
 *         description: User returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "665fa1112c1e4a0012b34569"
 *                     name:
 *                       type: string
 *                       example: "Sara Ahmed"
 *                     role:
 *                       type: string
 *                       example: "job_seeker"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *                     email:
 *                       type: string
 *                       example: "sara@example.com"
 *       400:
 *         description: Invalid user id format
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 *       404:
 *         description: User not found
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
 *                   example: "User not found"
 */
router.get("/:id",protect, authorize("admin"),getUserByID);  //getting user by id

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user by id
 *     description: Admin-only route. Permanently deletes a user account.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: "User deleted"
 *       400:
 *         description: Invalid user id format
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 *       404:
 *         description: User not found
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
 *                   example: "User not found"
 */
router.delete("/:id",protect, authorize("admin"),deleteUser);  //deleting user

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: List users
 *     description: Admin-only route returning a paginated list of users, filterable by role and status. Use ?role=recruiter&status=pending to find recruiters awaiting approval.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional role filter
 *         example: recruiter
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional status filter
 *         example: pending
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: number
 *           default: 20
 *         description: Number of users per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Users returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: number
 *                   example: 15
 *                 page:
 *                   type: number
 *                   example: 1
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "665fa1112c1e4a0012b34569"
 *                       name:
 *                         type: string
 *                         example: "Sara Ahmed"
 *                       email:
 *                         type: string
 *                         example: "sara@example.com"
 *                       role:
 *                         type: string
 *                         example: "recruiter"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-07T12:00:00.000Z"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 */
router.get('/', protect, authorize('admin'), getUsers);

/**
 * @openapi
 * /api/v1/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     description: Admin-only route. Approves, rejects, or resets a user's status. The primary use case is approving pending recruiters.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - approved
 *                   - rejected
 *                   - pending
 *                 description: "Allowed values: approved, rejected, pending."
 *                 example: approved
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "665fa1112c1e4a0012b34569"
 *                     status:
 *                       type: string
 *                       example: "approved"
 *       400:
 *         description: Invalid status or request
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 *       404:
 *         description: User not found
 */
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

module.exports = router;