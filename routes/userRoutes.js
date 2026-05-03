const express = require('express');
const router = express.Router();

//getting user from id
const {getUserByID, deleteUser} = require("../controllers/userController");

router.get("/:id",protect, authorize("admin"),getUserByID);  //getting user by id
router.delete("/:id",protect, authorize("admin"),deleteUser);  //deleting user
const { getUsers, updateUserStatus } = require('../controllers/userController');

router.get('/', protect, authorize('admin'), getUsers);
router.patch('/:id/status', protect, authorize('admin'), updateUserStatus);

module.exports = router;