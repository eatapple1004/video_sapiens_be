const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/send-otp",      userController.sendOtp);
router.post("/verify-otp",    userController.verifyOtp);
router.post("/user/register", userController.registerUser);

router.post("/user/login",    userController.loginUser);

router.get("/username", authenticate, userController.getTokenUsername);

module.exports = router;