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
 *     description: Admin-only route returning a single user by id.
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
 *       400:
 *         description: Invalid user id format
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 *       404:
 *         description: User not found
 */
router.get("/:id",protect, authorize("admin"),getUserByID);  //getting user by id

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user by id
 *     description: Admin-only route deleting a user account by id.
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
 *       400:
 *         description: Invalid user id format
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Admin role required.
 *       404:
 *         description: User not found
 */
router.delete("/:id",protect, authorize("admin"),deleteUser);  //deleting user

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: List users
 *     description: Admin-only route returning all users.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
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
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
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
 *     summary: Update recruiter status
 *     description: Admin-only route to approve or reject a recruiter account.
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
 *                 description: New recruiter status
 *                 example: approved
 *     responses:
 *       200:
 *         description: User status updated successfully
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