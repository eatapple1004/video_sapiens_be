const axios = require("axios");

const usersRepository   = require("../repositories/user.repository");
const analyzeRepository = require("../repositories/analyze.repository");
const ReelsVideoEntity  = require('../model/ReelsVideoEntity');
const TimelineEntity    = require('../model/TimelineEntity');

const logger = require("../utils/logger");

const DEF_AI_DEV_URL = process.env.DEF_AI_DEV_URL;

exports.sendAnalyzeRequest = async (url, userEmail) => {

    const userIdx = await usersRepository.getUserIdxByEmail(userEmail);
    logger.info(userEmail)
    let platform = null;
    let videoId = null;

    logger.info("[1_2. analyze video] record analyze attemp:: " + videoId);

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

    try {
        const response = await axios(config);
        const res_json = response.data;
        logger.info("[1_3. analyze video] response from AIBE :: " + JSON.stringify(res_json));
        return { rawData: res_json, userIdx };
    } catch (error) {
        logger.warn(error);
        throw new Error("AI 분석 요청 실패");
    }
};

exports.parseRawAnalyzedData = async (rawData, userIdx, platform) => {
    logger.info("[1_4. analyze video] start parse :: " + userIdx);
    const meta           = rawData.meta;
    const analysis_input = rawData.analysis_input;

    const videoEntity       = transformResponseData(meta, analysis_input , userIdx, platform);
    
    logger.info("[1_5. analyze video] end parse :: " + userIdx);
    return { videoEntity, analysis_input };
};

exports.recordAnalyzedData = async (videoEntity, analysis_input) => {

    try {
        logger.info("[1_6. analyze video] record video entity :: ");
        const videoIdx = await analyzeRepository.insertReelsVideo(videoEntity);
        //console.log(`[DB] video 저장 완료: idx = ${videoIdx}`);
        
        logger.info("[1_7. analyze video] record timeline entity :: " + videoIdx);
        const timelineEntities = transformTimeline(videoIdx, analysis_input.Timeline || []);

        if (timelineEntities.length > 0) {
          await analyzeRepository.insertTimelineBatch(timelineEntities, videoIdx);
          //console.log(`[DB] timeline ${timelineEntities.length}개 저장 완료`);
        }
        
        return true;
    } catch (err) {
        console.error("❌ recordAnalyzedData 실패:", err);
        throw err;
    }

    return true;
};

function transformResponseData(meta, analysis_input, userIdx, platform) {
    return new ReelsVideoEntity({
        reels_id: meta.id,
        upload_date: new Date(
          `${meta.upload_date.slice(0, 4)}-${meta.upload_date.slice(4, 6)}-${meta.upload_date.slice(6)}`
        ),
        video_name: meta.title || analysis_input.Title,
        creator_description: meta.description || null,
        video_length: meta.duration,
        resolution: `${meta.width}x${meta.height}`,
        music_info: null,
        view_count: meta.view_count,
        play_count: null,
        like_count: meta.like_count,
        comment_count: meta.comment_count,
        thumbnail_url: meta.thumbnail,
        platform: platform,
        owner_name: meta.uploader,
        owner_img: null,
        owner_follow: null,
        content_details: null,
        topic_description: null,
        topic_list: toPgArray(analysis_input?.Tags?.['Topic Tag']),
        genre_list: toPgArray(analysis_input?.Tags?.['Genre Tag']),
        format_list: toPgArray(analysis_input?.Tags?.['Format Tag']),
        one_line_summary: analysis_input['One-Line Content Summary'],
        summary: analysis_input.Summary,
        hook_tag: analysis_input['Hook Tag'],
        hook_overall_summary: analysis_input['Comprehensive Hook Summary'],
        visual_hook_summary: analysis_input['Visual Hook']?.['Visual Hook Summary'] || null,
        sound_hook_script: analysis_input['Sound Hook']?.['Script'] || null,
        sound_hook_summary: analysis_input['Sound Hook']?.['Sound Hook Summary'] || null,
        text_hook_content: analysis_input['Text Hook']?.['Text Content'] || null,
        text_hook_summary: analysis_input['Text Hook']?.['Text Hook Summary'] || null,
        user_email: null,
        user_idx: userIdx
      });
}

function transformTimeline(video_idx, timelineArr) {
    return timelineArr.map(item => new TimelineEntity({
        video_idx : video_idx,
        scene_start: item["Scene Start"],
        scene_end: item["Scene End"],
        scene_description: item["Scene Description"],
        dialogue: item["Dialogue"]
    }));
  }

  function toPgArray(value) {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    return [value]; // "Cute" → ["Cute"]
  }