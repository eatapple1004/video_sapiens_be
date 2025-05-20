require('../Def');  // 정의

const express    = require("express");
const nodemailer = require("nodemailer");
const redis      = require("redis");
const bcrypt     = require('bcrypt'); // bcryptjs 사용
const jwt        = require('jsonwebtoken');

// 라우터 객체 참조
var router = express.Router();

// Nodemailer 설정 (이메일 전송)
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: DEF_TEST_EMAIL, // Gmail 계정
        pass: DEF_TEST_PASS, // 앱 비밀번호 (2단계 인증 필요)
    },
});

// Redis 클라이언트 설정
const redisClient = redis.createClient();
redisClient.connect();

// OTP 생성 함수
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// ✅ **1) 사용자가 회원가입을 시도하면 OTP를 이메일로 전송**
router.post("/send-otp", async (req, res) => {

    console.log("[1_1. register otp request from FE] :: ");

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "이메일을 입력하세요." });

    const otp = generateOTP();

    // OTP를 Redis에 저장 (5분 동안 유지)
    await redisClient.setEx(email, 300, otp);

    // 이메일 전송
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "이메일 인증 코드",
        text: `인증 코드: ${otp} (5분 내로 입력해주세요.)`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: "인증 코드가 전송되었습니다." });
    } catch (error) {
        res.status(500).json({ message: "이메일 전송 실패", error });
    }
});

// ✅ **2) 사용자가 입력한 OTP를 검증**
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "이메일과 OTP를 입력하세요." });

    const storedOtp = await redisClient.get(email);
    if (!storedOtp) return res.status(400).json({ message: "OTP가 만료되었거나 잘못되었습니다." });

    if (storedOtp === otp) {
        //await redisClient.del(email); // OTP 삭제
        res.json({ message: "인증 성공" });
    } else {
        res.status(400).json({ message: "OTP가 일치하지 않습니다." });
    }
});

router.post("/user/register", async (req, res) => {  
    try {
        const { email, password, otp } = req.body;

        console.log("[1-1. 회원가입 request from FE] :: " + email);

        const storedOtp = await redisClient.get(email);
        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ message: "OTP 인증 실패" });
        }

        // 이메일 중복 확인
        const exists = await isUserExists(email);
        if (exists) return res.status(400).json({ message: "이미 가입된 이메일입니다." });

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 회원가입
        await registerUser(email, hashedPassword);

        // OTP 삭제
        await redisClient.del(email);

        res.status(201).json({ message: "회원가입 성공" });

    } catch (error) {
        console.error("회원가입 오류:", error);
        res.status(500).json({ message: "서버 오류", error });
    }
});

module.exports = router;