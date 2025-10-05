const express = require("express");
const router = express.Router();
const userController  = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/authMiddleware");

// register
router.post("/send-otp",      userController.sendOtp);
router.post("/verify-otp",    userController.verifyOtp);
router.post("/user/register", userController.registerUser);

// login
router.post("/user/login",    userController.loginUser);

// userEmail 반환
router.get("/username",   authenticate, userController.getTokenUsername);

// 유저 마킹 기능
router.post("/user/mark", userController.markVideo);

// Add New User Information
router.post("/user/addemail", userController.addNewUserEmail);

module.exports = router;