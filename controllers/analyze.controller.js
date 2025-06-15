const analyzeService = require("../services/analyze.service");
const jwt = require("jsonwebtoken");



exports.analyzeVideo = async (req, res) => {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        // ai 분석 요청 보내고 분석 결과 받기
        const { rawData, userIdx }    = await analyzeService.sendAnalyzeRequest(url, req.userEmail);
        
        // 분석 결과 데이터 파싱
        const { videoEntity, timelineEntities } = await analyzeService.parseRawAnalyzedData(rawData, userIdx);

        // 파싱 데이터 저장
        const isSaved    = await analyzeService.recordAnalyzedData(videoEntity, timelineEntities);

        // 분석 내용 보내기 
        if(isSaved) {
            res.status(200).json(videoEntity);
        }
        else {
            res.status(500).json({ error: "분석 요청 실패" });
        }
        
    } catch (err) {
        console.error("분석 중 오류:", err);
        res.status(500).json({ error: "분석 요청 실패" });
    }
};
