const analyzeService = require("../services/analyze.service");
const jwt = require("jsonwebtoken");



exports.analyzeVideo = async (req, res) => {
    const { url } = req.body;

    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const result = await analyzeService.sendAnalyzeRequest(url, req.userEmail);
        res.status(200).json(result);
    } catch (err) {
        console.error("분석 중 오류:", err);
        res.status(500).json({ error: "분석 요청 실패" });
    }
};
