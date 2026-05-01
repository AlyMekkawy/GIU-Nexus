const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// POST /api/v1/auth/register — Public
router.post('/register', register);

// POST /api/v1/auth/login — Public
router.post('/login', login);

module.exports = router;
