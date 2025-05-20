require('../Def');  // 정의
const logger       = require("../utils/logger");
const passwordUtil = require("../utils/password");
const userRepo     = require("../repositories/user.repository");

const express    = require("express");
const nodemailer = require("nodemailer");
const redis      = require("redis");

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


// 1) 사용자가 회원가입을 시도하면 OTP를 이메일로 전송
router.post("/send-otp", async (req, res) => {

    const { email } = req.body;

    logger.info("[1_1. register otp request from FE] :: " + email);

    if (!email) {
        logger.info("[1_2. register otp request from FE] :: fail with empty email");
        return res.status(400).json({ message: "이메일을 입력하세요." });
    }
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
        logger.info("[1_2. register otp request from FE] :: send otp code to " + email);
    } catch (error) {
        res.status(500).json({ message: "이메일 전송 실패", error });
        logger.info("[1_2. register otp request from FE] :: fail send otp code to " + email);
    }
});

// 2) 사용자가 입력한 OTP를 검증
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    logger.info("[1.1 verify otp request from FE] :: " + email);
    if (!email || !otp) return res.status(400).json({ message: "이메일과 OTP를 입력하세요." });

    const storedOtp = await redisClient.get(email);
    if (!storedOtp) { 
        logger.info("[1.2 verify otp request from FE] :: no opt in redis for - " + email);
        return res.status(400).json({ message: "OTP가 만료되었거나 잘못되었습니다." });
    }
    if (storedOtp === otp) {
        res.json({ message: "인증 성공" });
        logger.info("[1.2 verify otp request from FE] :: success verify otp for - " + email);
    } else {
        res.status(400).json({ message: "OTP가 일치하지 않습니다." });
        logger.info("[1.2 verify otp request from FE] :: fail verify otp for - " + email);
    }
});

// 3) 사용자 회원가입 성공, DB 저장 시작
router.post("/user/register", async (req, res) => {  
    try {
        const { email, password, otp } = req.body;

        logger.info("[1-1. register request from FE] :: " + email);

        const storedOtp = await redisClient.get(email);
        if (!storedOtp || storedOtp !== otp) {
            return res.status(400).json({ message: "OTP 인증 실패" });
        }

        logger.info("[1-2. register request from FE] :: success otp verify - " + email);

        // 이메일 중복 확인
        const exists = await userRepo.isUserExists(email);
        if (exists) {
            logger.info("[1-3. register request from FE] :: exist email - " + email);
            return res.status(400).json({ message: "이미 가입된 이메일입니다." });
        }
        logger.info("[1-3. register request from FE] :: new email - " + email);

        // 비밀번호 해싱
        const hashedPassword = await passwordUtil.hashPassword(password);

        // 회원가입
        await userRepo.registerUser(email, hashedPassword);

        // OTP 삭제
        await redisClient.del(email);

        res.status(201).json({ message: "회원가입 성공" });
        logger.info("[1-4. register request from FE] :: new email - " + email);

    } catch (error) {
        console.error("회원가입 오류:", error);
        res.status(500).json({ message: "서버 오류", error });
    }
});

async function loginUser(email, password) {
    try {
        //await client.connect();
        console.log("1 :: 쿼리 시작 :: " + email )
        // 사용자 정보 조회
        const query = `SELECT idx, password_hash FROM users WHERE email = $1`;
        const result = await client.query(query, [email]);
        
        console.log("result.rows.length :: " + result.rows.length)
        if (result.rows.length === 0) {
            console.log("❌ 로그인 실패: 사용자 없음");
            return false;
        }

        const user = result.rows[0];
        
        console.log("2 :: " +user.password_hash)

        return user.password_hash;
        /*
        // 비밀번호 검증
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log("❌ 로그인 실패: 비밀번호 불일치");
            return false;
        }

        // JWT 토큰 발급
        const token = jwt.sign({ userId: user.id }, 'SECRET_KEY', { expiresIn: '7d' });

        console.log(`✅ 로그인 성공 (JWT 토큰: ${token})`);

        // 세션 테이블에 저장
        await client.query(`
            INSERT INTO sessions (user_id, session_token, expires_at) 
            VALUES ($1, $2, NOW() + INTERVAL '7 days');
        `, [user.id, token]);
        */

    } catch (error) {
        console.error("❌ 로그인 오류:", error);
    } finally {
        
    }
}

module.exports = router;