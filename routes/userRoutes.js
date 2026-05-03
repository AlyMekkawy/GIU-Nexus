const express = require('express');
const router = express.Router();

const { getUsers, updateUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getUsers);
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

//getting user from id
const {getUserByID} = require("../controllers/userController");
const {protect, authorize} = require("../middleware/auth");

//deleting a user
const {deleteUser} = require("../controllers/userController");

router.get("/:id",protect, authorize("admin"),getUserByID);  //getting user by id
router.delete("/:id",protect, authorize("admin"),deleteUser);  //deleting user

module.exports = router;