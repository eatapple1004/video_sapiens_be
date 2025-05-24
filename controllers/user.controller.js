const userService = require("../services/user.service");
const logger      = require("../utils/logger");

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  logger.info("[1_1. send otp] :: " + email);
  try {
    const result = await userService.sendOtp(email);
    res.json({ message: result });
    logger.info("[1_4. send otp] :: send response to FE - " + email);
  } catch (err) {
    res.status(500).json({ message: "OTP 전송 실패", error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  logger.info("[1_1. verify otp] :: " + email);
  try {
    await userService.verifyOtp(email, otp);
    res.json({ message: "인증 성공" });
    logger.info("[1_3. verify otp] :: success with - " + email);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { email, password, otp } = req.body;
  try {
    await userService.registerUser(email, password, otp);
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

    try {
      const token = await userService.loginUser(email, password);

      // JWT 토큰을 쿠키로 전송
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 3600000, // 1시간
        domain: ".videosapiens.ai"
      });

      res.status(200).json({ message: "로그인 성공" });
    } catch (err) {
      res.status(400).json({ message: err.message || "로그인 실패" });
    }
};