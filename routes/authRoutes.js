const express = require('express');
const { register, login, logout } = require('../controllers/authController');

const router = express.Router();

// POST /api/v1/auth/register — Public
router.post('/register', register);

// POST /api/v1/auth/login — Public
router.post('/login', login);

// POST /api/v1/auth/logout — Private
router.post('/logout', logout);

module.exports = router;
