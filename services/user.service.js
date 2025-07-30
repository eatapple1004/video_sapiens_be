require("dotenv").config();
const nodemailer   = require("nodemailer");
const redisClient  = require("../config/redis");
const userRepo     = require("../repositories/user.repository");
const logger       = require("../utils/logger");
const jwtUtil      = require("../utils/jwt");
const passwordUtil = require("../utils/password");

// 메일 설정
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.DEF_TEST_EMAIL,
    pass: process.env.DEF_TEST_PASS,
  },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendOtp = async (email) => {
    if (!email) {
        logger.info("[1_2. send otp] :: empty email - " + email);
        throw new Error("이메일이 필요합니다.");
    }
    const otp = generateOTP();
    await redisClient.setEx(email, 300, otp);
    logger.info("[1_2. send otp] :: generate otp - " + email);

    await transporter.sendMail({
        from: process.env.DEF_TEST_EMAIL,
        to: email,
        subject: "이메일 인증 코드",
        text: `인증 코드: ${otp} (5분 내로 입력해주세요.)`,
    });
    logger.info("[1_3. send otp] :: send otp to email - " + email);
    return "인증 코드가 전송되었습니다.";
};

exports.verifyOtp = async (email, otp) => {
  const storedOtp = await redisClient.get(email);
  if (!storedOtp || storedOtp !== otp) {
    logger.info("[1_2. verify otp] :: fail verify otp - " + email);
    throw new Error("OTP가 만료되었거나 일치하지 않습니다.");
  }
  logger.info(`[OTP 검증 성공] ${email}`);
  logger.info("[1_2. verify otp] :: success verify otp - " + email);
};

exports.registerUser = async (email, password, otp) => {
    const storedOtp = await redisClient.get(email);
    if (!storedOtp || storedOtp !== otp) {
      logger.info("[1_2. register user] :: fial verify opt" + email);
      throw new Error("OTP 인증 실패");
    }

    const exists = await userRepo.isUserExists(email);
    if (exists) {
      throw new Error("이미 가입된 이메일입니다.");
    }
    const hashedPassword = await passwordUtil.hashPassword(password);
    await userRepo.registerUser(email, hashedPassword);
    logger.info("[1_1. register user] :: " + email);

    await redisClient.del(email);
    logger.info(`[회원가입 성공] ${email}`);
};

exports.loginUser = async (email, plainPassword) => {
    
    logger.info("[1_2. user login - check email]         :: " + email);
    const hashedPassword = await userRepo.getPasswordHashByEmail(email);
    if (!hashedPassword) throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");

    logger.info("[1_3. user login - check password]      :: " + email);
    const isMatch = await passwordUtil.comparePassword(plainPassword, hashedPassword);
    if (!isMatch) throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");

    const token = jwtUtil.generateToken({ username: email });
    return token;
};

/**
 * 유저 마킹 기능 파싱
 * @param {String} userEmail : 유저를 식별하기 위한 이메일
 * @param {String} platform_shortcode : 파싱이 필요한 데이터 analyzed_video idx를 도출 해내야 한다
 */
exports.parseMarkRequest = async (req) => {
  try {
    const userEmail = req.userEmail;
    const platform_shortcode = req.platform_shortcode;

    if (!platform_shortcode.includes('_')) {
      throw new Error('입력값은 반드시 "platform_shortcode" 형식이어야 합니다.');
    }

    const [platform, ...codeParts] = platform_shortcode.split('_');
    const video_code = codeParts.join('_');

    return {userEmail, platform, video_code};
  }
  catch(err) {
    logger.error("[ User Mark, parseMarkRequest ERROR ] :: " + err.stack);
    throw err;
  }
}

/**
 * 마킹 기능
 * 1. 유저와 비디오 특정
 * 2. 유저 테이블에 마킹 리스트에 analyzed_video_idx 저장
 * @param {String} userEmail : 유저를 식별하기 위한 이메일
 * @param {String} platform : 영상 식별 키 일부
 * @param {String} video_code : 영상 식별 코드
 */
exports.markingDatabaseUpdate = async (userEmail, platform, video_code) => {
  try{
    const analyzedVideoIdx = await searchAnalyzedVideoIdxService(platform, video_code);
    const markingResult = await markAnalyzedVideoIdxService(userEmail, analyzedVideoIdx);
    return markingResult;
  }
  catch(err) {

  }
}

async function searchAnalyzedVideoIdxService(platform, video_code) {
  try {
    const analyzedVideoIdx = await userRepo.searchAnalyzedVideoIdxRepo(platform, video_code);
    return analyzedVideoIdx;
  }
  catch(err) {
    logger.err('[마킹 시스템 analyzed_video idx 찾는 도중 에러 발생] :: ' + err.stack); 
    throw err;
  }
}

async function markAnalyzedVideoIdxService(userEmail, analyzedVideoIdx) {
  try {
    const markingResult = await userRepo.markAnalyzedVideoIdxRepo(userEmail, analyzedVideoIdx);
    return markingResult;
  }
  catch(err) {
    logger.err('[마킹 시스템 analyzed_video idx 입력중 에러 발생] :: ' + err.stack); 
    throw err;
  }
}


