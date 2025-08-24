const redis = require('../config/redis');
const trendingService = require("../services/trending.service");

exports.getTrendingPosts = async (req, res) => {
    //const topIdx = await redis.lRange('viral_post_top300', 0, 299);
    try {
        console.log("get trend list request");
        const idxList = await redis.lRange('viral_post_top300', 0, 299); // 문자열 배열
        const posts = await trendingService.getPostListData(idxList);
    
        res.json({ top_posts: posts });
    } catch (err) {
        console.error("🔥 트렌딩 포스트 조회 실패:", err.message);
        res.status(500).json({ error: "Server Error" });
    }
};

exports.getTrendingIdxs = async (req, res) => {
    const topIdx = await redis.lRange('viral_post_top300', 0, 299);



    // 예: idx만 넘기고, 프론트에서 추가 요청 유도 or 상세 데이터 조회
    res.json({ top_post_idx: topIdx });
};