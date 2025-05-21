const authService = require("../services/user.service");

exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  logger.info("[1_1. send otp] :: " + email);
  try {
    const result = await authService.sendOtp(email);
    res.json({ message: result });
  } catch (err) {
    res.status(500).json({ message: "OTP 전송 실패", error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    await authService.verifyOtp(email, otp);
    res.json({ message: "인증 성공" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.registerUser = async (req, res) => {
  const { email, password, otp } = req.body;
  try {
    await authService.registerUser(email, password, otp);
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
