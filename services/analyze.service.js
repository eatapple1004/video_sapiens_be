const axios = require("axios");
const DEF_AI_DEV_URL = process.env.DEF_AI_DEV_URL;

exports.analyze = async (url) => {
    let platform = null;
    let videoId = null;

    if (url.includes("youtube.com/shorts") || url.includes("youtu.be")) {
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
        url: `${process.env.DEF_AI_DEV_URL}/api/offer/analyze`,
        headers: {},
        data: body,
    };

    const response = await axios(config);
    return response.data;
};
