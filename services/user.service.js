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

/**
 * 이메일로 OTP(일회용 인증 코드)를 생성하고 전송하는 함수
 * 
 * @param   {string} email    - OTP를 전송할 사용자 이메일 주소
 * 
 * @throws  {Error}           - 이메일이 없을 경우 예외 발생
 * 
 * @returns {Promise<string>} - OTP 전송 완료 메시지 반환
 */
exports.sendOtp = async (email) => {
  try {
    if (!email) {
      throw new Error("이메일이 필요합니다.");
    }

    const otp = generateOTP();
    await redisClient.setEx(email, 300, otp);

    await transporter.sendMail({
      from:    process.env.DEF_TEST_EMAIL,
      to:      email,
      subject: "이메일 인증 코드",
      text:    `인증 코드: ${otp} (5분 내로 입력해주세요.)`,
    });

    return "인증 코드가 전송되었습니다.";
  } catch (err) {
    logger.error("[ User Service, sendOtp, Email :: " + email  + " ERROR :: " + err.stack);
    throw err; 
  }
};

/**
 * 저장된 OTP와 입력된 OTP를 비교하여 인증을 검증하는 함수
 * 
 * @param {string} email - 인증 대상 이메일 주소
 * @param {string} otp   - 사용자로부터 입력받은 OTP 코드
 * 
 * @throws {Error} 저장된 OTP가 없거나 입력한 OTP와 일치하지 않을 경우 예외 발생
 * 
 * @returns {Promise<void>} 인증 성공 시 별도 반환값 없음
 */
exports.verifyOtp = async (email, otp) => {
  try {
    const storedOtp = await redisClient.get(email);
    
    if (!storedOtp || storedOtp !== otp) {
      throw new Error("OTP가 만료되었거나 일치하지 않습니다.");
    }
    
  } catch (err) {
    logger.error("[ User Service, verifyOtp, Email :: " + email  + " ERROR :: " + err.stack);
    throw err;
  }
};

/**
 * 사용자 회원가입을 처리하는 함수
 * 
 * @param {string} email    - 사용자 이메일
 * @param {string} password - 사용자 비밀번호 (평문)
 * @param {string} otp      - 사용자 입력 OTP 코드
 * 
 * @throws {Error} OTP 인증 실패, 이미 가입된 이메일, 기타 처리 중 에러 발생 시 예외 던짐
 * 
 * @returns {Promise<void>} 회원가입 성공 시 반환값 없음
 */
exports.registerUser = async (email, password, otp) => {
  try {
    const storedOtp = await redisClient.get(email);
    if (!storedOtp || storedOtp !== otp) {
      throw new Error("OTP 인증 실패");
    }

    const exists = await userRepo.isUserExists(email);
    if (exists) {
      throw new Error("이미 가입된 이메일입니다.");
    }

    const hashedPassword = await passwordUtil.hashPassword(password);
    await userRepo.registerUser(email, hashedPassword);
    
    await redisClient.del(email);
  } catch (err) {
    logger.error("[ User Service, registerUser, Email :: " + email  + " ERROR :: " + err.stack);
    throw err;
  }
};

/**
 * 사용자 로그인 처리 함수
 * 
 * @param {string} email - 사용자 이메일
 * @param {string} plainPassword - 사용자가 입력한 평문 비밀번호
 * 
 * @throws {Error} 이메일이 존재하지 않거나 비밀번호가 일치하지 않을 경우 예외 발생
 * 
 * @returns {Promise<string>} 로그인 성공 시 JWT 토큰 반환
 */
exports.loginUser = async (email, plainPassword) => {
  try {
    // 1. 이메일로 해시된 비밀번호 조회
    const hashedPassword = await userRepo.getPasswordHashByEmail(email);
    if (!hashedPassword) {
      throw new Error(AUTH_ERROR_MSG);
    }

    // 2. 입력된 비밀번호와 비교
    const isMatch = await passwordUtil.comparePassword(plainPassword, hashedPassword);
    if (!isMatch) {
      throw new Error(AUTH_ERROR_MSG);
    }

    // 3. JWT 토큰 생성 및 반환
    const token = jwtUtil.generateToken({ username: email });
    return token;
  } catch (err) {
    logger.error("[ User Service, loginUser, Email :: " + email  + " ERROR :: " + err.stack);
    throw err;
  }
};

/**
 * 유저 마킹 기능을 위한 요청 데이터 파싱 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.userEmail 및 req.body.platform_shortcode 포함
 * 
 * @throws {Error} platform_shortcode 형식이 올바르지 않을 경우 예외 발생
 * 
 * @returns {Promise<{userEmail: string, platform: string, video_code: string}>} 
 *          userEmail:  요청 유저 이메일
 *          platform:   platform_shortcode에서 분리된 플랫폼 명
 *          video_code: platform_shortcode에서 분리된 영상 코드
 */
exports.parseMarkRequest = async (req) => {
  try {
    // 1. userEmail
    const userEmail = req.userEmail;
    const platform_shortcode = req.body.platform_shortcode;

    // 2. platform_shortcode 데이터 확인
    if (!platform_shortcode.includes('_')) {
      throw new Error('입력값은 반드시 "platform_shortcode" 형식이어야 합니다.');
    }

    // 3. platform_shortcode 파싱
    const [platform, ...codeParts] = platform_shortcode.split('_');
    const video_code = codeParts.join('_');

    return {userEmail, platform, video_code};
  }
  catch(err) {
    logger.error("[ User Service, parseMarkRequest, Email :: " + userEmail  + " ERROR :: " + err.stack);
    throw err;
  }
}

/**
 * 유저의 마킹 리스트에 특정 영상을 저장하는 함수
 * 
 * 1. platform과 video_code로 analyzed_video의 인덱스 조회
 * 2. 조회된 인덱스를 유저 마킹 리스트에 저장
 * 
 * @param {string} userEmail  - 유저를 식별하기 위한 이메일
 * @param {string} platform   - 영상 식별 키 일부
 * @param {string} video_code - 영상 식별 코드
 * 
 * @throws {Error} 내부 서비스 호출 실패 시 예외 발생
 * 
 * @returns {Promise<boolean>} 마킹 성공 여부 반환
 */
exports.markingDatabaseUpdate = async (userEmail, platform, video_code) => {
  try{
    const analyzedVideoIdx = await searchAnalyzedVideoIdxService(platform, video_code);
    const markingResult    = await markAnalyzedVideoIdxService(userEmail, analyzedVideoIdx);
    return markingResult;
  }
  catch(err) {
    logger.error("[ User Service, parseMarkRequest, Email :: " + userEmail  + " ERROR :: " + err.stack);
    throw err;
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


