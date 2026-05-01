const express = require('express');
const { register, login, logout, forgotPassword, resetPassword } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/v1/auth/register — Public
router.post('/register', authLimiter, register);

// POST /api/v1/auth/login — Public
router.post('/login', authLimiter, login);

// POST /api/v1/auth/logout — Private
router.post('/logout', logout);

// POST /api/v1/auth/forgot-password — Public
router.post('/forgot-password', authLimiter, forgotPassword);

// PATCH /api/v1/auth/reset-password/:token — Public
router.patch('/reset-password/:token', resetPassword);

module.exports = router;
