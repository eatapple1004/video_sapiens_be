// middlewares/authMiddleware.js
const { verifyToken } = require("../utils/jwt");
const logger = require("../utils/logger");
const DEF_JWT_SECRET_KEY = process.env.DEF_JWT_SECRET_KEY;

exports.authenticate = (req, res, next) => {
    //const token = req.cookies?.token;

    const authHeader = req.headers.authorization;
    
    logger.info(JSON.stringify(req.cookies))
    
    const token = req.cookies?.authToken; 
    //|| (authHeader && authHeader.startsWith("Bearer ") && authHeader.split(" ")[1]);


    if (!token) {
        return res.status(401).json({ message: "인증 토큰이 없습니다." });
    }

    logger.info(token);

    try {
        const decoded = verifyToken(token, DEF_JWT_SECRET_KEY); // ✅ utils/jwt.js의 함수 사용
        logger.info(decoded);
        req.userEmail = decoded.username; // 예: { email: ..., id: ... }
        next();
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};
