const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.post("/send-otp",      userController.sendOtp);
router.post("/verify-otp",    userController.verifyOtp);
router.post("/user/register", userController.registerUser);

router.post("/user/login",    userController.loginUser);

module.exports = router;
