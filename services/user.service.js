const redisClient = require("../config/redis");
const userRepo = require("../repositories/user.repository");
const passwordUtil = require("../utils/password");
const logger = require("../utils/logger");
const nodemailer = require("nodemailer");

// 메일 설정
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER || DEF_TEST_EMAIL,
    pass: process.env.EMAIL_PASS || DEF_TEST_PASS,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (email) => {
  if (!email) throw new Error("이메일이 필요합니다.");

  const otp = generateOTP();
  await redisClient.setEx(email, 300, otp);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    text: `인증 코드: ${otp} (5분 내로 입력해주세요.)`,
  });

  logger.info(`[OTP 전송] ${email} → ${otp}`);
  return "인증 코드가 전송되었습니다.";
};

exports.verifyOtp = async (email, otp) => {
  const storedOtp = await redisClient.get(email);
  if (!storedOtp || storedOtp !== otp) {
    logger.warn(`[OTP 검증 실패] ${email}`);
    throw new Error("OTP가 만료되었거나 일치하지 않습니다.");
  }
  logger.info(`[OTP 검증 성공] ${email}`);
};

exports.registerUser = async (email, password, otp) => {
  const storedOtp = await redisClient.get(email);
  if (!storedOtp || storedOtp !== otp) {
    throw new Error("OTP 인증 실패");
  }

  const exists = await userRepo.isUserExists(email);
  if (exists) throw new Error("이미 가입된 이메일입니다.");

  const hashedPassword = await passwordUtil.hashPassword(password);
  await userRepo.registerUser(email, hashedPassword);

  await redisClient.del(email);
  logger.info(`[회원가입 성공] ${email}`);
};
