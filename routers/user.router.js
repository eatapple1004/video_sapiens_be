const express = require("express");
const router = express.Router();
const authController = require("../controllers/user.controller");

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/user/register", authController.registerUser);

module.exports = router;
