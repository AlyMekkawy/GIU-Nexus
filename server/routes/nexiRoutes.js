const express = require('express');
const { nexiChat } = require('../controllers/nexiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/nexi/chat
router.post('/chat', protect, nexiChat);

module.exports = router;
