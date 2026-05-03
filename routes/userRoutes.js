const express = require('express');
const router = express.Router();

//getting user from id
const {getUserByID, deleteUser} = require("../controllers/userController");
const {protect, authorize} = require("../middleware/auth");

router.get("/:id",protect, authorize("admin"),getUserByID);  //getting user by id
router.delete("/:id",protect, authorize("admin"),deleteUser);  //deleting user

module.exports = router;
