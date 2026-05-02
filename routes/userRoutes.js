const express = require('express');
const router = express.Router();

const { getUsers, updateUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getUsers);
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

module.exports = router;