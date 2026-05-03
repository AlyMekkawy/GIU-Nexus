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
 *                       example: "user"
 *                     status:
 *                       type: string
 *                       example: "active"
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
 *                       example: "Backend developer with experience in Node.js, Express, and MongoDB."
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Node.js", "Express", "MongoDB"]
 *                     profilePicture:
 *                       type: string
 *                       example: "https://example.com/uploads/profile.jpg"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     status:
 *                       type: string
 *                       example: "active"
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


// PATCH /api/v1/profile/change-password - private (any authenticated user)
router.patch('/change-password', protect, changePassword);

// POST /api/v1/profile/extract-skills - private (jobSeeker only)
router.post('/extract-skills', protect, authorize('jobSeeker'), extractSkills);

module.exports = router;