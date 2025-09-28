// middlewares/authMiddleware.js
const { verifyToken } = require("../utils/jwt");
const logger = require("../utils/logger");
const DEF_JWT_SECRET_KEY = process.env.DEF_JWT_SECRET_KEY;

// 로그인 필수 인증 함수 - library 진입
exports.authenticate = (req, res, next) => {
    
    const token = req.cookies?.authToken; 

    if (!token) {
        return res.status(401).json({ message: "인증 토큰이 없습니다." });
    }

    try {
        const decoded = verifyToken(token, DEF_JWT_SECRET_KEY); // ✅ utils/jwt.js의 함수 사용
        req.userEmail = decoded.username; // 예: { email: ..., id: ... }
        next();
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// 로그인 & 비로그인 통합 인증 함수 - 검색 진입
exports.optionalAuthenticate = (req, res, next) => {
    const token = req.cookies?.authToken;
    if (!token) {
        logger.info("비로그인")
        return next(); // 토큰 없으면 비로그인 모드
    }
    try {
        
        const decoded = verifyToken(token, DEF_JWT_SECRET_KEY);
        req.userEmail = decoded.username; // 로그인 정보 저장
    } catch (error) {
      logger.warn("유효하지 않은 토큰, 비로그인 모드로 진행");
    }
    next();
};