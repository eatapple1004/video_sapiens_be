const analyzeService = require("../services/analyze.service");
const logger       = require("../utils/logger");
const jwt = require("jsonwebtoken");



exports.analyzeVideo = async (req, res) => {
    const { url } = req.body;
    logger.info("[1_1. analyze video] Get Request from FE :: " + url);
    if (!url) return res.status(400).json({ error: "URL is required" });

    let platform = null;
    let videoId  = null;

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
    
    logger.info("[1_2. analyze video] record analyze attemp:: " + videoId);

    const existVideoID = await analyzeService.checkExistService(videoId);

    try {
        // ai 분석 요청 보내고 분석 결과 받기
        const { rawData, userIdx }    = await analyzeService.sendAnalyzeRequest(url, req.userEmail, platform, videoId);
        
        // 분석 결과 데이터 파싱
        const { videoEntity, analysis_input } = await analyzeService.parseRawAnalyzedData(rawData, userIdx);

        // 파싱 데이터 저장
        const isSaved    = await analyzeService.recordAnalyzedData(videoEntity, analysis_input);

        
        // 분석 내용 보내기 
        if (isSaved) {
            const responseData = transformResponseData(videoEntity);
            logger.info("[1_8. analyze video] send Response to FE :: " + JSON.stringify(responseData));
            res.status(200).json(responseData);
        }
        else {
            res.status(500).json({ error: "분석 요청 실패" });
        }
        
    } catch (err) {
        console.error("분석 중 오류:", err);
        res.status(500).json({ error: "분석 요청 실패" });
    }
};

function transformResponseData(entity) {
    return {
        reels_id: entity.reels_id,
        upload_date: entity.upload_date,
        video_name: entity.video_name,
        caption: entity.creator_description, // 이름 변경
        video_length: entity.video_length,
        resolution: entity.resolution,
        music_info: entity.music_info,
        video_metadata: {
            view_count: entity.view_count,
            play_count: entity.play_count,
            like_count: entity.like_count,
            comment_count: entity.comment_count,
            thumbnail: entity.thumbnail_url,
        },
        platform: entity.platform,
        owner_name: entity.owner_name,
        owner_profile_picture: entity.owner_img,
        owner_follow: entity.owner_follow,
        content_details: [entity.content_details],
        topic_description: entity.topic_description,
        topic_list: [entity.topic_list],
        genre_list: [entity.genre_list],
        format_list: [entity.format_list],
        one_line_summary: entity.one_line_summary,
        summary: entity.summary,
        hook_tag: [entity.hook_tag],
        hook_overall_summary: entity.hook_overall_summary,
        visual_hook: {
            script: "", // 없으면 빈값
            summary: entity.visual_hook_summary
        },
        sound_hook: {
            script: entity.sound_hook_script,
            summary: entity.sound_hook_summary
        },
        text_hook: {
            script: entity.text_hook_content,
            summary: entity.text_hook_summary
        }
    };
}
