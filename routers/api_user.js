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


router.post("/login", (req, res) => {
    //Hello World 데이터 반환
    
});



module.exports = router;