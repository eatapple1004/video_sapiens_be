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
    const meta           = rawData.meta;
    const analysis_input = rawData.analysis_input;

    const videoEntity       = transformResponseData(meta, analysis_input);
    const timelineEntities = transformTimeline(meta.id, analysis_input.Timeline || []);
    
    return { videoEntity, timelineEntities };
};

exports.recordAnalyzedData = async (parsedData) => {
    return true;
};

function transformResponseData(meta, analysis_input) {
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
        platform: 'YouTube',
        owner_name: meta.uploader,
        owner_img: null,
        owner_follow: null,
        content_details: null,
        topic_description: null,
        topic_list: analysis_input?.Tags?.['Topic Tag'] || null,
        genre_list: analysis_input?.Tags?.['Genre Tag'] || null,
        format_list: analysis_input?.Tags?.['Format Tag'] || null,
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
        user_idx: null
      });
}

function transformTimeline(reels_id, timelineArr) {
    return timelineArr.map(item => new TimelineEntity({
      reels_id,
      scene_start: item["Scene Start"],
      scene_end: item["Scene End"],
      scene_description: item["Scene Description"],
      dialogue: item["Dialogue"]
    }));
  }