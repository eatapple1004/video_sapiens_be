// utils/jwt.js
const jwt = require("jsonwebtoken");
const SECRET_KEY = DEF_JWT_SECRET_KEY;

exports.generateToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        console.error("JWT 검증 실패:", error.message);
        throw new Error("유효하지 않은 토큰");
    }
};
