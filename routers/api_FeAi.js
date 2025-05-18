require('../Def');  // 정의

const express      = require("express");
const cookieParser = require('cookie-parser');
const jwt   = require('jsonwebtoken');

var axios  = require('axios');
var router = express.Router();

const { saveReelsData }        = require('../database/analyzeQuery'); 
const { processAndSaveImages } = require('./saveImage');

function transformResponseData(responseData) {
    return {
        reels_id: responseData.reels_id,
        upload_date: responseData.upload_date,
        video_name: responseData.video_name,
        caption: responseData.creator_description, // creator_description -> caption
        video_length: responseData.video_length,
        resolution: responseData.resolution,
        music_info: responseData.music_info,
        video_metadata: {
            view_count: responseData.video_metadata.view_count,
            play_count: responseData.video_metadata.play_count,
            like_count: responseData.video_metadata.like_count,
            comment_count: responseData.video_metadata.comment_count,
            thumbnail: responseData.video_metadata.thumbnail,
        },
        platform: responseData.platform,
        owner_name: responseData.owner_name,
        owner_profile_picture: responseData.owner_profile_picture,
        owner_follow: responseData.owner_follow,
        content_details: [responseData.content_details], // 문자열로 (배열) 변환
        topic_description: responseData.topic_description,
        topic_list: [responseData.topic_list], // 문자열을 배열로 변환 - cancle - cancle(20250330)
        genre_list: [responseData.genre_list], // 문자열로 (배열)
        format_list: [responseData.format_list], // 문자열로 (배열)
        one_line_summary: responseData.one_line_summary,
        summary: responseData.summary,
        hook_tag: [responseData.hook_tag], // 문자열을 배열로 변환
        hook_overall_summary: responseData.hook_overall_summary,
        visual_hook: {
            script: "", // 새롭게 추가된 script 필드
            summary: responseData.visual_hook.visual_hook_summary
        },
        sound_hook: {
            script: responseData.sound_hook.script,
            summary: responseData.sound_hook.sound_hook_summary
        },
        text_hook: {
            script: responseData.text_hook.text_content, // text_content -> script
            summary: responseData.text_hook.text_hook_summary
        }
    };
}

router.get("/reels/:reels_id", (req, res) => { 

    const token = req.cookies.authToken;

    let email = null;
    try {
        const decoded = jwt.verify(token, DEF_JWT_SECRET_KEY);
        email = decoded.username;
    } catch (err) {
        console.error("JWT 디코딩 오류:", err);
    }
    console.log(email);

    const reelsId = req.params.reels_id;
    console.log(`[${new Date().toISOString()}] `+" [1-1. 영상 분헉 request from FE] :: " + reelsId);

    var url = encodeURI(DEF_AI_DEV_URL+ `/api/reels/${reelsId}`);
  
    var data = {}
    
    var config = {
      method  : 'get',
      url     :  url,
      headers :  {},
      //data    :  data
    };
  
    console.log(`[${new Date().toISOString()}]`+ " [1-2. 영상 분석 request to bhBE] :: " + reelsId);
  
    axios(config)
    .then(function (response) {
        console.log(`[${new Date().toISOString()}]` + " [1-3. 영상 분석 response from bhBE] :: " );//+ JSON.stringify(response.data));

        var res_json = response.data;
        //base64 -> 이미지 파일 변환
        var imgPath = processAndSaveImages(response.data);

        res_json.owner_profile_picture    = DEF_BE_DEV_URL+imgPath.owner_img;
        res_json.video_metadata.thumbnail = DEF_BE_DEV_URL+imgPath.thumbnail_url;

        // DB 업데이트 - 작업 진행 필요 -완료 20250312:16:04
        res_json.user_email = email;
        saveReelsData(res_json);
        console.log(res_json); // add log

        console.log(`[${new Date().toISOString()}]` + " [1-4. 영상 분석 response to FE] :: " + reelsId);
        res.send(transformResponseData(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
    
})


router.post("/analyze/platform", async (req, res) => {
    const { url } = req.body;
  
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
  
    let platform = null;
    let videoId = null;
    let targetEndpoint = null;
  
    try {
      // YouTube Shorts
      if (url.includes("youtube.com/shorts") || url.includes("youtu.be")) {
        platform = "YouTube";
        const match = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([\w-]+)/);
        videoId = match ? match[1] : null;
        targetEndpoint = "http://localhost:8001/youtube/analyze";
  
      // Instagram Reels
      } else if (url.includes("instagram.com/reel")) {
        platform = "Instagram";
        const match = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
        videoId = match ? match[1] : null;
        targetEndpoint = "http://localhost:8002/instagram/analyze";
  
      // TikTok
      } else if (url.includes("tiktok.com")) {
        platform = "TikTok";
        const match = url.match(/video\/(\d+)/);
        videoId = match ? match[1] : null;
        targetEndpoint = "http://localhost:8003/tiktok/analyze";
  
      } else {
        return res.status(400).json({ error: "지원되지 않는 플랫폼입니다." });
      }
  
      if (!videoId) {
        return res.status(400).json({ error: "영상 ID를 추출할 수 없습니다." });
      }
  
      // request 전송
      const response = await axios.post(DEF_AI_DEV_URL+"/analyze/platform", {
        platform,
        videoId,
        originalUrl: url
      });
  
      return res.json(response.data);
  
    } catch (err) {
      console.error("분석 중 오류:", err.message);
      return res.status(500).json({ error: "분석 요청 실패" });
    }
  });
  
module.exports = router;