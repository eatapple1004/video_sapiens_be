const userService = require("../services/user.service");
const logger      = require("../utils/logger");

/**
 * OTP 전송 요청을 처리하는 컨트롤러 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.body에 email 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {void} 응답은 JSON 형식으로 반환됨
 */
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await userService.sendOtp(email);
    res.json({ message: result });
  } catch (err) {
    logger.error("[ User Controller, sendOtp, Error :: " + err.stack + " ]")
    res.status(500).json({ message: "OTP 전송 실패", error: err.message });
  }
};

/**
 * OTP 인증 요청을 처리하는 컨트롤러 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.body에 email과 otp 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {void} 인증 성공 시 JSON 메시지 반환, 실패 시 에러 메시지 반환
 */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    await userService.verifyOtp(email, otp);
    res.json({ message: "인증 성공" });
  } catch (err) {
    logger.error("[ User Controller, verifyOtp, Error :: " + err.stack + " ]")
    res.status(400).json({ message: err.message });
  }
};

/**
 * 사용자 회원가입 요청을 처리하는 컨트롤러 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.body에 email, password, otp 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {void} 회원가입 성공 시 201 상태와 메시지 반환, 실패 시 에러 메시지 반환
 */
exports.registerUser = async (req, res) => {
  const { email, password, otp } = req.body;
  try {
    await userService.registerUser(email, password, otp);
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    logger.error("[ User Controller, registerUser, Error :: " + err.stack + " ]")
    res.status(400).json({ message: err.message });
  }
};

/**
 * 사용자 로그인 요청을 처리하는 컨트롤러 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.body에 email과 password 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {void} 로그인 성공 시 JWT 토큰을 쿠키로 전송하고 성공 메시지 반환, 실패 시 에러 메시지 반환
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
      const token = await userService.loginUser(email, password);

      res.cookie("authToken", token, {
        httpOnly: true,       //  JavaScript 접근 불가 (보안 강화)
        secure:   true,       //  HTTPS 환경에서만 전송
        sameSite: "Strict",   //  XSS 공격 방지
        maxAge:   3600000,    //  1시간
      });

      res.status(200).json({ message: "로그인 성공" });
    } catch (err) {
      logger.error("[ User Controller, loginUser, Error :: " + err.stack + " ]")
      res.status(400).json({ message: err.message || "로그인 실패" });
    }
};

/**
 * JWT 토큰에서 추출된 사용자 이메일(username)을 응답하는 컨트롤러 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.userEmail에 사용자 이메일 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {void} 사용자 이메일을 JSON 형식으로 반환
 */
exports.getTokenUsername = async (req, res) => {
  const username = req.userEmail;
  res.status(200).json({ username : username })
}


/**
 * 사용자의 영상 마킹 요청을 처리하는 컨트롤러 함수
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, 마킹 요청 데이터 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {void} 마킹 성공 시 성공 메시지와 함께 true 반환, 실패 시 에러 메시지 반환
 */
exports.markVideo = async (req, res) => {
  try{
    // 1. 데이터 파싱
    const {userEmail, platform, video_code} = await userService.parseMarkRequest(req);

    // 2. DB 업데이트
    const result = await userService.markingDatabaseUpdate(userEmail, platform, video_code);

    // 3. 성공 response
    res.status(200).json({
      success: result,
      message: '마킹 성공'
    });
  }
  catch(err) {
    logger.error("[ User Controller, markVideo, Error :: " + err.stack + " ]")
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error:   err.message
    });
  }
}