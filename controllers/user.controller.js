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
    logger.info("[1_1. register user] :: " + email);
    await userService.registerUser(email, password, otp);
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  logger.info("[1_1. user login - get request from FE] :: " + email);

    try {
      const token = await userService.loginUser(email, password);

      logger.info("[1_4. user login - send token to FE]    :: " + email);
      // JWT 토큰을 쿠키로 전송
      res.cookie("authToken", token, {
        httpOnly: true,     //  JavaScript 접근 불가 (보안 강화)
        secure: true,       //  HTTPS 환경에서만 전송
        sameSite: "Strict", //  XSS 공격 방지
        maxAge: 3600000,    //  1시간
        //domain: ".videosapiens.ai"
      });

      res.status(200).json({ message: "로그인 성공" });
    } catch (err) {
      res.status(400).json({ message: err.message || "로그인 실패" });
    }
};

exports.getTokenUsername = async (req, res) => {

  logger.info("[1_1. username 조회 request from FE]" + req.userEmail);
  const username = req.userEmail;

  res.status(200).json({
    username : username
  })
  logger.info("[1_2. username 조회 response to FE]" + req.userEmail);

}

exports.markVideo = async (req, res) => {
  try{
    // 1. 데이터 파싱
    const {userEmail, platform, video_code} = await userService.parseMarkRequest(req);

    // 2. DB 업데이트
    const result = await markingDatabaseUpdate(userEmail, platform, video_code);

    // 3. 성공 response
    res.status(200).json({
      success: result,
      message: '마킹 성공'
  });
  }
  catch(err) {
    logger.error('[Tag Search, Controller ,tagSearch ERROR] :: ' + err.stack);
    res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
    });
  }
}