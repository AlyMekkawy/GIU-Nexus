const express = require('express');
const { register } = require('../controllers/authController');

const router = express.Router();

// POST /api/v1/auth/register — Public
router.post('/register', register);

module.exports = router;
