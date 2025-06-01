// middlewares/authMiddleware.js
const { verifyToken } = require("../utils/jwt");

exports.authenticate = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "인증 토큰이 없습니다." });
    }

    try {
        const decoded = verifyToken(token); // ✅ utils/jwt.js의 함수 사용
        req.userEmail = decoded.username; // 예: { email: ..., id: ... }
        next();
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};
