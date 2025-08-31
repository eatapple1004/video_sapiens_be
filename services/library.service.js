const logger = require("../utils/logger");

const searchRepo    = require("../repositories/search.repository");
const libraryRepo   = require("../repositories/library.repository");

const SearchResultVO                    = require('../model/searchResultVO');
const AnalyzedResultVO                  = require('../model/analyzedResultVO');
const MergedSearchAndAnalyzedResultDTO  = require('../model/MergedSearchAndAnalyzedResultDTO');
const PlatformInfoVO                    = require('../model/platformInfoVO');

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
        throw new Error('통합 검색 WHERE 절 생성 실패');
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
    if (!rawUrl || typeof rawUrl !== 'string') {
        return { platform: 'unknown', rawUrl, canonicalUrl: null, ids: {}, meta: {} };
    }

    const url   = rawUrl.trim();
    const u     = safeParseUrl(url);
    const host  = (u?.hostname || '').toLowerCase().replace(/^www\./, '');

    // ---------- YouTube ----------
    if (
        host.endsWith('youtube.com') ||
        host === 'youtu.be' ||
        host === 'music.youtube.com' ||
        host === 'm.youtube.com'
    ) {
        const { videoId, isShorts } = extractYouTubeId(u);
        const canonicalUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
        return new PlatformInfoVO({
            platform: 'youtube',
            rawUrl: url,
            canonicalUrl,
            ids: { videoId },
            meta: { isShorts }
        });
    }

    // ---------- Instagram ----------
    if (host.endsWith('instagram.com')) {
        const { shortcode, kind } = extractInstagramShortcode(u);
        const canonicalUrl = shortcode ? `https://www.instagram.com/${kind}/${shortcode}/` : null;
        return  new PlatformInfoVO({
            platform: 'instagram',
            rawUrl: url,
            canonicalUrl,
            ids: { shortcode },
            meta: { kind } // 'p' | 'reel' | 'tv'
        });
    }

    // ---------- TikTok ----------
    if (host.endsWith('tiktok.com') || host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
        const { videoId, username } = extractTikTokId(u);
        const canonicalUrl = videoId
        ? (username
            ? `https://www.tiktok.com/@${username}/video/${videoId}`
            : `https://www.tiktok.com/video/${videoId}`)
        : null;
        return new PlatformInfoVO({
            platform: 'tiktok',
            rawUrl: url,
            canonicalUrl,
            ids: { videoId, username },
            meta: {}
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
    const qs = u.searchParams || new URLSearchParams();
  
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