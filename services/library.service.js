require("dotenv").config();
const logger = require("../utils/logger");
const axios  = require('axios');

const searchRepo    = require("../repositories/search.repository");
const libraryRepo   = require("../repositories/library.repository");

const SearchResultVO                    = require('../model/searchResultVO');
const AnalyzedResultVO                  = require('../model/analyzedResultVO');
const MergedSearchAndAnalyzedResultDTO  = require('../model/MergedSearchAndAnalyzedResultDTO');
const PlatformInfoVO                    = require('../model/platformInfoVO');
const AutoInsertResDTO                  = require('../model/autoInsertResDTO');
const CreatorTableEntity                = require('../model/Entity/creatorTableEntity');
const PostTableEntity                   = require('../model/Entity/postTableEntity');

/**
 * 유저 이메일를 이용하여 유저를 식별후
 * 특정된 유저의 marked한 analyzed_video의 idx 리스트들을 반환 한다
 */
exports.getUserMarkListService = async (userEmail) => {
    try{
        const markList = await libraryRepo.getUserMarkListRepo(userEmail);
        return markList;
    }
    catch(err) {
        logger.error('getUserMarkListService Error:', err.stack);
        throw new Error('마킹 리스트 검색 WHERE 절 생성 실패');
    }
}

exports.makeMarkedWhereClause = async (userInputIntegarted) => {
    try {
        // 문자열 → 숫자로 변환, 유효한 양의 정수만 통과
        const safeIdxList = userInputIntegarted
            .map(item => parseInt(item, 10))
            .filter(num => Number.isInteger(num) && num > 0);

        if (safeIdxList.length === 0) {
            return 'FALSE'; // 조건 없음 → WHERE FALSE
        }
        
        const whereClause = ` WHERE a.idx = ANY(ARRAY[${safeIdxList.join(',')}]::int[])`;
        return whereClause;
    } catch (err) {
      
    }
}


/**
 * 지원 플랫폼: youtube | instagram | tiktok
 * 반환: { platform, rawUrl, canonicalUrl, ids, meta }
 */
 exports.detectPlatform = function detectPlatform(rawUrl) {
    console.log("URL :: " + rawUrl);
    if (!rawUrl || typeof rawUrl !== 'string') {
        return new PlatformInfoVO({ 
            platform: 'unknown', 
            rawUrl, 
            canonicalUrl: null, 
            ids: {}, 
            meta: {} 
        });
    }

    const url   = rawUrl.trim();
    const u     = safeParseUrl(url);
    const host  = (u?.hostname || '').toLowerCase().replace(/^www\./, '');

    // ---------- YouTube ----------
    if (
        host.endsWith('youtube.com') ||
        host === 'youtu.be'          ||
        host === 'music.youtube.com' ||
        host === 'm.youtube.com'
    ) {
        const { videoId, isShorts } = extractYouTubeId(u);
        const canonicalUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
        
        return new PlatformInfoVO({
            platform     : 'youtube',
            rawUrl       : url,
            canonicalUrl : canonicalUrl,
            ids          : { videoId },
            meta         : { isShorts }
        });
    }

    // ---------- Instagram ----------
    if (host.endsWith('instagram.com')) {
        const { shortcode, kind } = extractInstagramShortcode(u);
        const canonicalUrl = shortcode ? `https://www.instagram.com/${kind}/${shortcode}/` : null;
        
        return  new PlatformInfoVO({
            platform     : 'instagram',
            rawUrl       : url,
            canonicalUrl : canonicalUrl,
            ids          : { shortcode },
            meta         : { kind } // 'p' | 'reel' | 'tv'
        });
    }

    // ---------- TikTok ----------
    if (
        host.endsWith('tiktok.com') || 
        host === 'vm.tiktok.com'    || 
        host === 'vt.tiktok.com'
    ) {
        const { videoId, username } = extractTikTokId(u);
        const canonicalUrl = videoId
        ? (username
            ? `https://www.tiktok.com/@${username}/video/${videoId}`
            : `https://www.tiktok.com/video/${videoId}`)
        : null;
        
        return new PlatformInfoVO({
            platform     : 'tiktok',
            rawUrl       : url,
            canonicalUrl : canonicalUrl,
            ids          : { videoId, username },
            meta         : {}
        });
    }

    // ---------- Unknown ----------
    return { platform: 'unknown', rawUrl: url, canonicalUrl: null, ids: {}, meta: {} };
};

function safeParseUrl(s) {
    try   { return new URL(s); } 
    catch { return null; }
}


function extractYouTubeId(u) {
    if (!u) return { videoId: null, isShorts: false };
    
    const path = u.pathname || '';
    const qs   = u.searchParams || new URLSearchParams();
  
    // watch?v=VIDEO_ID
    let v = qs.get('v');
    if (v) return { videoId: v, isShorts: false };
  
    // youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') {
      const id = path.slice(1).split('/')[0];
      if (id) return { videoId: id, isShorts: false };
    }
  
    // /shorts/VIDEO_ID
    const shortsMatch = path.match(/\/shorts\/([A-Za-z0-9_-]{5,})/);
    if (shortsMatch) return { videoId: shortsMatch[1], isShorts: true };
  
    // /embed/VIDEO_ID
    const embedMatch = path.match(/\/embed\/([A-Za-z0-9_-]{5,})/);
    if (embedMatch) return { videoId: embedMatch[1], isShorts: false };
  
    return { videoId: null, isShorts: false };
}

function extractInstagramShortcode(u) {
    if (!u) return { shortcode: null, kind: null };
    
    // 지원 경로: /p/{code}/, /reel/{code}/, /tv/{code}/
    const m = u.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (m) return { kind: m[1], shortcode: m[2] };
    return { shortcode: null, kind: null };
}

function extractTikTokId(u) {
    if (!u) return { videoId: null, username: null };
    
    // 경로 패턴: /@username/video/{id}
    const m = u.pathname.match(/^\/@([^/]+)\/video\/(\d+)/);
    if (m) return { username: m[1], videoId: m[2] };
  
    // 일부 퍼머링크: /video/{id}
    const m2 = u.pathname.match(/^\/video\/(\d+)/);
    if (m2) return { username: null, videoId: m2[1] };
  
    // 단축 링크(vm.tiktok.com 등)은 서버측에서 HEAD로 풀어야 정확 (여기선 식별 불가 처리)
    return { videoId: null, username: null };
}

/**
 * Retrieve YouTube Video Details through Proxy
 * @param {PlatformInfoVO} platformInfo - detectPlatform에서 넘어온 VO
 * @returns {Promise<Object>} - 프록시 서버 응답(JSON)
 */
exports.retrieveYoutubeVideo = async (platformInfo) => {
    try {
        if (!platformInfo || platformInfo.platform !== 'youtube') {
            throw new Error('Invalid platformInfo: must be youtube');
        }
    
        // 프록시 서버 주소 (예시: process.env.PROXY_SERVER_URL 환경변수)
        const proxyUrl = process.env.DEF_PROXY_DEV_URL || 'http://localhost:3000';
    
        // 실제 요청 (예시로 canonicalUrl 전달)
        const response = await axios.post(`${proxyUrl}/youtube/video`, {
            url: platformInfo.rawUrl,
            ids: platformInfo.ids
        });

        // 성공 시 데이터 반환
        console.log("Response Data :: ");
        console.log(response.data);
        return response.data;
    
    } catch (error) {
        logger.error('[retrieveYoutubeVideo] error:', error.message);
        // 에러를 상위 컨트롤러까지 던짐
        throw error;
    }
}


exports.makeAutoInsertResDTO = async (data) => {
    try{
        return new AutoInsertResDTO({
            platform          : data.platform,
            short_code        : data.video_id,
            views             : data.views,
            likes             : data.likes,
            comments          : data.comments,
            creator           : data.creator,
            video_title       : data.video_title,
            video_description : data.video_description,
            upload_date       : data.upload_date,
            thumbnail_url     : data.thumbnail_url,
        });
    }
    catch(err) {
        throw error;
    }
}


exports.getYoutubeChannelData = async (channerID) => {
    try{
        // 프록시 서버 주소 (예시: process.env.PROXY_SERVER_URL 환경변수)
        const proxyUrl = process.env.DEF_PROXY_DEV_URL || 'http://localhost:3000';
        
        console.log("채널 ID :: " + channerID);

        // 실제 요청 (예시로 canonicalUrl 전달)
        const response = await axios.post(`${proxyUrl}/youtube/channel`, {
            channelHandle: channerID
        });

        return response.data;
    }
    catch(err) {
        logger.error('[getYoutubeChannelData] error:', err.message);
        // 에러를 상위 컨트롤러까지 던짐
        throw err;
    }
}

/**
 * YouTube 채널 메타데이터를 CreatorTableEntity로 변환
 * @param {Object} youtubeChannelData
 * @returns {CreatorTableEntity}
 */
 exports.convertYoutubeChannelDataToEntity = async (youtubeChannelData) => {
    try {
        const entity = new CreatorTableEntity({
            idx: null, // INSERT 시에는 null 또는 생략
            platform: 'youtube',
            biography: youtubeChannelData.description ?? null,
            followers: parseSubscribersText(youtubeChannelData.subscribers_text), // YouTube는 subscriber 숫자를 파싱해야함 (원하는 경우 파싱 로직 추가 가능)
            followings: null, // YouTube에선 불가
            full_name: youtubeChannelData.title ?? null,
            ig_id: youtubeChannelData.ChannelId ?? null, // YouTube에선 channelId를 ig_id 필드에 임시로 저장
            category_name: null, // YouTube에는 카테고리 정보 없음
            username: youtubeChannelData.handle ?? null, // @handle
            profile_pic_url: youtubeChannelData.avatars?.url ?? null,
            relate_profile: null, // YouTube는 연관 프로필 없음
            created_at: new Date(),
            updated_at: new Date()
        });

        return entity;
    } catch (err) {
        console.error('[convertYoutubeChannelDataToEntity ERROR] ::', err.stack);
        throw err;
    }
};

/**
 * YouTube 구독자 문자열 → 숫자로 파싱
 * @param {string} subscribersText - 예: '607K subscribers', '1.2M subscribers'
 * @returns {number|null} 파싱된 구독자 수 (실패 시 null)
 */
 function parseSubscribersText(subscribersText) {
    if (!subscribersText || typeof subscribersText !== 'string') return null;

    const match = subscribersText.match(/^([\d,.]+)([KM]?)\s+subscribers$/i);

    if (!match) return null;

    let [ , numberStr, unit ] = match;
    numberStr = numberStr.replace(',', ''); // 쉼표 제거

    let number = parseFloat(numberStr);

    switch (unit.toUpperCase()) {
        case 'K':
            number *= 1_000;
            break;
        case 'M':
            number *= 1_000_000;
            break;
        // 'B' 같은 단위가 들어올 수도 있음
        case 'B':
            number *= 1_000_000_000;
            break;
        default:
            break;
    }

    return Math.round(number);
}

/**
 * YouTube 영상 메타데이터를 PostTableEntity로 변환
 * @param {Object} youtubeVideoData - YouTube 메타데이터 객체
 * @param {number} creatorIdx - 관련된 creator 테이블의 idx
 * @returns {PostTableEntity}
 */
 exports.convertYoutubeVideoToPostEntity = (youtubeVideoData) => {
    const {
      video_title,
      video_id,
      uploader,
      channel_id,
      videoURL,
      views,
      likes,
      comments,
      duration,
      upload_date,
      categories,
      tags,
      uploader_id,
      video_description,
      timestamp
    } = youtubeVideoData;
  
    return new PostTableEntity({
      creator_idx: null,
      owner_id: channel_id,
      owner_username: uploader,
      typename: 'youtube',
      post_id: channel_id, // 또는 video id를 따로 추가해도 됨
      shortcode: video_id,     // YouTube에는 shortcode 없음
      width: null,
      height: null,
      is_video: true,
      has_audio: true, // YouTube 영상은 기본적으로 오디오 있음
      video_view_count: views,
      caption: video_description || video_title,
      comment_count: comments,
      like_count: likes,
      preview_like_count: null,
      taken_at: timestamp ? new Date(timestamp * 1000) : null,
      song_name: null,
      artist_name: null,
      audio_id: null,
      is_original_song: null,
      created_at: new Date(),
      updated_at: new Date(),
      video_url: videoURL,
      thumbnail_url: null, // 썸네일 URL이 별도 있으면 추가
      viral_score: 0
    });
  };