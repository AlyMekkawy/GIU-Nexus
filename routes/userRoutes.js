const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/userController');

router.get('/admin/stats', protect, authorize('admin'), getAdminStats);

//getting user from id
const {getUserByID, deleteUser} = require("../controllers/userController");
const { getUsers, updateUserStatus } = require('../controllers/userController');
const {protect, authorize} = require("../middleware/auth");

router.get("/:id",protect, authorize("admin"),getUserByID);  //getting user by id
router.delete("/:id",protect, authorize("admin"),deleteUser);  //deleting user


router.get('/', protect, authorize('admin'), getUsers);
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

module.exports = router;
