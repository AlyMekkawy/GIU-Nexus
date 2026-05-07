const express = require('express');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword, extractSkills } = require('../controllers/profileController');
const router = express.Router();

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     description: >
 *       Private route. Returns the full profile of the currently authenticated user.
 *       Requires a valid Authorization header using the Bearer token format.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged-in user's full profile returned successfully
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
 *                       example: "65f1c7e7a29f4c001234abcd"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john@example.com"
 *                     bio:
 *                       type: string
 *                       example: "Full-stack developer interested in AI jobs."
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["JavaScript", "Node.js", "MongoDB"]
 *                     profilePicture:
 *                       type: string
 *                       example: "https://example.com/uploads/profile.jpg"
 *                     role:
 *                       type: string
 *                       example: "jobSeeker"
 *                     status:
 *                       type: string
 *                       description: Present only for recruiter accounts.
 *                       example: "pending"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
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
 *                   example: "Not authorized, token failed"
 *       400:
 *         description: Invalid user id format
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
 *                   example: "Invalid user id format"
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
// GET /api/v1/profile - private (any authenticated user)
router.get('/', protect, getProfile);

/**
 * @openapi
 * /api/v1/profile:
 *   patch:
 *     summary: Update logged-in user's profile
 *     description: >
 *       Private route. Updates the currently authenticated user's own profile.
 *       All fields are optional. Requires a valid Authorization header using
 *       the Bearer token format.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated display name
 *                 example: "John Doe"
 *               bio:
 *                 type: string
 *                 description: User bio. Used as input for skill extraction.
 *                 example: "Backend developer with experience in Node.js, Express, and MongoDB."
 *               profilePicture:
 *                 type: string
 *                 description: URL to profile image
 *                 example: "https://example.com/uploads/profile.jpg"
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated skills list
 *                 example: ["Node.js", "Express", "MongoDB"]
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 updatedFields:
 *                   type: object
 *                   description: Only the fields that were provided in the request.
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     bio:
 *                       type: string
 *                       example: "Backend developer with experience in Node.js, Express, and MongoDB."
 *                     profilePicture:
 *                       type: string
 *                       example: "https://example.com/uploads/profile.jpg"
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Node.js", "Express", "MongoDB"]
 *       400:
 *         description: Invalid profile update data
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
 *                   example: "Invalid profile data"
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
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
 *                   example: "Not authorized, token failed"
 */
// PATCH /api/v1/profile - private (any authenticated user)
router.patch('/', protect, upload.single('profilePicture'), updateProfile);

/**
 * @openapi
 * /api/v1/profile/change-password:
 *   patch:
 *     summary: Change logged-in user's password
 *     description: >
 *       Private route. Allows any authenticated user to change their own password
 *       while logged in. This is separate from the forgot-password flow because it
 *       requires the user to know their current password.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match the user's currently stored password hash
 *                 example: "OldPassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password. Must be at least 8 characters and include upper/lowercase letters, a digit, and a special character.
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                   example: "Password updated successfully"
 *       400:
 *         description: Missing fields or password validation failed
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
 *                   example: "Password must contain: at least 8 characters, one uppercase letter, one lowercase letter, one digit, one special character (!@#$%...)"
 *       401:
 *         description: Unauthorized or current password is incorrect
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
 *                   example: "Current password is incorrect"
 */
// PATCH /api/v1/profile/change-password - private (any authenticated user)
router.patch('/change-password', protect, changePassword);

/**
 * @openapi
 * /api/v1/profile/extract-skills:
 *   post:
 *     summary: Extract skills from bio
 *     description: Job seeker-only route that extracts skills from the provided bio text.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bio
 *             properties:
 *               bio:
 *                 type: string
 *                 description: Bio text used for skill extraction
 *                 example: "Backend developer with Node.js, Express, and MongoDB."
 *     responses:
 *       200:
 *         description: Skills extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Node.js", "Express", "MongoDB"]
 *       400:
 *         description: Missing or invalid bio
 *       401:
 *         description: Unauthorized. Missing, invalid, or expired token.
 *       403:
 *         description: Forbidden. Job seeker role required.
 */
// POST /api/v1/profile/extract-skills - private (jobSeeker only)
router.post('/extract-skills', protect, authorize('jobSeeker'), extractSkills);

module.exports = router;