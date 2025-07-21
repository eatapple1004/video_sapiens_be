//require('./Def');  // 정의
require("dotenv").config();
const pool = require("./config/database");

//express 모듈 불러오기
const express      = require("express");
const path         = require('path');
const cors         = require('cors');  
const cookieParser = require('cookie-parser');


const app = express();

const https = require('https');
const http  = require('http');
const fs    = require('fs');

app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: ["https://api.videosapiens.ai",
            "https://www.api.videosapiens.ai", 
            "https://videosapiens.ai", 
            "https://www.videosapiens.ai",
            "http://localhost:3000"],  // 허용할 도메인
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 허용할 HTTP 메서드
    allowedHeaders: ["Content-Type", "Authorization"], // 허용할 헤더
    credentials: true  // 쿠키 및 인증 정보 허용
}));

const user_router    = require('./routers/user.router');
const search_router  = require('./routers/search.router');

app.use('/api', user_router);
app.use('/api', search_router);

app.use("/upload", express.static(path.join(__dirname, "/uploads")));

app.get("/info", (req, res) => {
    //Hello World 데이터 반환
    res.send(process.env.DEF_APP_TITLE + " made by "+ process.env.DEF_APP_GREATE_DATE);
});


// 등록되지 않은 패스에 대해 페이지 오류 응답 
app.use((req, res, next) => {
    res.status(404).send(`
      <center>
        <h1>ERROR - Unable to find a Page.</h1>
        <h2>${process.env.DEF_APP_TITLE} by YJ</h2>
      </center>
    `);
  });

//HTTP 서버 시작
if(process.env.DEF_USING_HTTP == "true")
{
    if(typeof process.env.DEF_EVP_LOCAL_HTTP_PORT != 'undefined') 
    {
        // Create an HTTP service.
        http.createServer(app).listen(process.env.DEF_EVP_LOCAL_HTTP_PORT, () => console.log(process.env.DEF_APP_TITLE  + " HTTP Server For Test(" + process.env.DEF_EVP_LOCAL_HTTP_PORT +")"));
    }
}

// 사용에 대한 확인  필요
if(process.env.DEF_USING_HTTPS == true)
{
    if(typeof process.env.DEF_EVP_LOCAL_HTTPS_PORT != 'undefined') 
    {
        // Create an HTTPS service identical to the HTTP service.
        https.createServer(options, app).listen(process.env.DEF_EVP_LOCAL_HTTPS_PORT,  () => console.log(process.env.DEF_APP_TITLE  + " HTTPS Server For Test(" + process.env.DEF_EVP_LOCAL_HTTPS_PORT +")"));
    }
}