const express = require('express');

const { authLimiter } = require('../middleware/rateLimiter');

const { register, login, logout, forgotPassword, resetPassword, verifyOtp } = require('../controllers/authController');

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: >
 *       Public route. Creates a new user account. Recruiter accounts are returned
 *       with a pending status until approved.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: Display name
 *                 example: "Sara Ahmed"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Must be unique
 *                 example: "sara@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Must be at least 8 characters and include upper/lowercase letters, a digit, and a special character.
 *                 example: "Password123!"
 *               role:
 *                 type: string
 *                 enum:
 *                   - jobSeeker
 *                   - recruiter
 *                 description: User account role
 *                 example: "jobSeeker"
 *     responses:
 *       201:
 *         description: User account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Signed JWT
 *                   example: "signed.jwt.token"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65f1c7e7a29f4c001234abcd"
 *                     name:
 *                       type: string
 *                       example: "Sara Ahmed"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "sara@example.com"
 *                     role:
 *                       type: string
 *                       enum:
 *                         - jobSeeker
 *                         - recruiter
 *                       example: "jobSeeker"
 *                     status:
 *                       type: string
 *                       description: Present only for recruiter accounts.
 *                       example: "pending"
 *       400:
 *         description: Invalid input, password complexity failure, or email already in use
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
 */
// POST /api/v1/auth/register — Public
router.post('/register', authLimiter, register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user
 *     description: >
 *       Public route. Returns a JWT for a valid email and password combination.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sara@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Secret123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Signed JWT
 *                   example: "signed.jwt.token"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65f1c7e7a29f4c001234abcd"
 *                     name:
 *                       type: string
 *                       example: "Sara Ahmed"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "sara@example.com"
 *                     role:
 *                       type: string
 *                       example: "jobSeeker"
 *                     status:
 *                       type: string
 *                       description: Present only for recruiter accounts.
 *                       example: "approved"
 *                     profilePicture:
 *                       type: string
 *                       example: ""
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["React", "Node.js"]
 *       400:
 *         description: Missing email or password
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
 *                   example: "Email and password are required"
 *       401:
 *         description: Invalid email or password
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
 *                   example: "Invalid email or password"
 */
// POST /api/v1/auth/login — Public
router.post('/login', authLimiter, login);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out current user
 *     description: >
 *       Private route. Performs stateless logout by instructing the client to discard
 *       the JWT. Requires a valid Authorization header using the Bearer token format.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                   example: "Logged out successfully"
 *       401:
 *         description: Unauthorized. Missing or invalid token.
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
 *                   example: "Not authorised – invalid token"
 */
// POST /api/v1/auth/logout — Private
router.post('/logout', logout);

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     description: >
 *       Public route. Sends a password reset link to the given email address.
 *       Always responds with 200 to avoid email enumeration.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sara@example.com"
 *     responses:
 *       200:
 *         description: Password reset email response returned successfully
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
 *                   example: "Password reset email sent"
 *       400:
 *         description: Invalid email format or missing email
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
 *                   example: "Email is required"
 *       500:
 *         description: Email could not be sent
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
 *                   example: "Email could not be sent"
 */
// POST /api/v1/auth/forgot-password — Public
router.post('/forgot-password', authLimiter, forgotPassword);

/**
 * @openapi
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP code
 *     description: >
 *       Public route. Verifies the one-time password (OTP) sent to the user's email.
 *       Used to confirm identity before allowing password reset.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sara@example.com"
 *               otp:
 *                 type: string
 *                 description: 6-digit verification code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *                   example: "OTP verified successfully"
 *                 resetToken:
 *                   type: string
 *                   description: One-time reset token used with reset-password.
 *                   example: "reset-token-value"
 *       400:
 *         description: Invalid or expired OTP
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
 *                   example: "Invalid or expired OTP"
 */
// POST /api/v1/auth/verify-otp — Public
router.post('/verify-otp', verifyOtp);

/**
 * @openapi
 * /api/v1/auth/reset-password/{token}:
 *   patch:
 *     summary: Reset password using reset token
 *     description: >
 *       Public route. Resets the user's password using the reset token received
 *       via email.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token received via email
 *         example: "reset-token-value"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password. Must be at least 8 characters and include upper/lowercase letters, a digit, and a special character.
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Signed JWT
 *                   example: "signed.jwt.token"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "65f1c7e7a29f4c001234abcd"
 *                     name:
 *                       type: string
 *                       example: "Sara Ahmed"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "sara@example.com"
 *                     role:
 *                       type: string
 *                       example: "jobSeeker"
 *                     status:
 *                       type: string
 *                       description: Present only for recruiter accounts.
 *                       example: "approved"
 *                     profilePicture:
 *                       type: string
 *                       example: ""
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *       400:
 *         description: Token is invalid or has expired, or password validation failed
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
 *                   example: "Invalid or expired reset token"
 */
// PATCH /api/v1/auth/reset-password/:token — Public
router.patch('/reset-password/:token', resetPassword);

module.exports = router;
