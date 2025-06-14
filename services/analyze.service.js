const axios = require("axios");

const usersRepository   = require("../repositories/user.repository");
const analyzeRepository = require("../repositories/analyze.repository");
const logger = require("../utils/logger");

const DEF_AI_DEV_URL = process.env.DEF_AI_DEV_URL;

exports.sendAnalyzeRequest = async (url, userEmail) => {

    const userIdx = await usersRepository.getUserIdxByEmail(userEmail);
    logger.info(userEmail)
    let platform = null;
    let videoId = null;

    if (url.includes("youtube.com/shorts") || url.includes("youtube")) {
        platform = "YouTube";
        const match = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([\w-]+)/);
        videoId = match ? match[1] : null;
    } else if (url.includes("instagram.com/reel")) {
        platform = "Instagram";
        const match = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
        videoId = match ? match[1] : null;
    } else if (url.includes("tiktok.com")) {
        platform = "TikTok";
        const match = url.match(/video\/(\d+)/);
        videoId = match ? match[1] : null;
    } else {
        throw new Error("지원되지 않는 플랫폼입니다.");
    }

    if (!videoId) {
        throw new Error("영상 ID를 추출할 수 없습니다.");
    }

    // 영상 분석 요청 db 저장
    const requestIdx = await analyzeRepository.insertAnalyzeRequest({
        userIdx,
        videoId,
        platform,
        originalUrl: url
    });

    const body = {
        platform,
        videoId,
        originalUrl: url,
    };

    const config = {
        method: "post",
        url: `${DEF_AI_DEV_URL}/api/offer/analyze`,
        headers: {},
        data: body,
    };

    axios(config)
        .then(function (response) {
            console.log(`[${new Date().toISOString()}]` + " [1-3. 영상 분석 response from bhBE] :: " );//+ JSON.stringify(response.data));
  
            var res_json = response.data;
         
            console.log(`[${new Date().toISOString()}]` + " [1-4. 영상 분석 response to FE] :: ");
          
            return res_json;
        })
        .catch(function (error) {
            logger.warn(error);
        });
};

exports.parseRawAnalyzedData = async (rawData) => {

};

exports.recordAnalyzedData = async (parsedData) => {
    return true;
};