const logger = require('../utils/logger');

const searchService   = require("../services/search.service");
const libraryService  = require("../services/library.service");
const gerneralService = require("../services/general.service");

const SearchResultVO   = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');


/**
 * 라아브러리 유저 체크 컨트롤러
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.retrieveCheckedMarkedVideos = async (req, res) => {
   
    try {
        // 1. 라이브러리 유저 데이터
        const userEmail = req.userEmail;

        // 2. 유저 mark_list 번호 가져 오기
        const markList = await libraryService.getUserMarkListService(userEmail);
        
        // 3. 받은 markList들을 기준으로 where절 생성
        const whereClause = await libraryService.makeMarkedWhereClause(markList);
       
        // 4. search result list
        const searchResultVOList = await searchService.getSearchResult(whereClause);
    
        // 5. analyzed result list
        const analyzedResultVOList = await searchService.getAnalyzedResult(whereClause);
        
        // 6. 두가지 합치기
        const responsePayload = await searchService.mergeSearchAndAnalyzedResult(
            searchResultVOList,
            analyzedResultVOList
        );

        // 6. 유저 마킹 리스트 response 반환
        res.status(200).json({
            success: true,
            message: '마킹 조회 성공',
            data: responsePayload
        });
    }
    catch(err) {
        logger.error('[Library, Controller ,retrieveCheckedMarkedVideos ERROR] :: ' + err.stack);
    }
}


/**
 * Library Auto Insert (Blank)
 *
 * 플랫폼(YouTube/Instagram/TikTok)을 자동 판별한 뒤,
 * 해당 플랫폼의 프록시 크롤링 로직으로 위임하여
 * 영상/포스트의 핵심 메타(인게이지먼트 등)를 수집/저장한다.
 *
 * @route   POST /api/library/auto-insert
 * @access  Private (권한 정책에 따라 조정)
 *
 * @param   {string} req.body.videoUrl  - 원본 URL (예: "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
 *
 * @param   {import('express').Response} res
 * @returns {Promise<void>}              JSON 응답을 직접 전송한다.
 *
 * @typedef  {Object} PlatformInfoVO
 * @property {('youtube'|'instagram'|'tiktok'|'unknown')} platform
 * @property {string}   rawUrl
 * @property {string?}  canonicalUrl
 * @property {Object}   ids            - 식별자 묶음 (예: { videoId }, { shortcode }, { videoId, username })
 * @property {Object}   meta           - 부가정보 (예: { isShorts }, { kind: 'p'|'reel'|'tv' })
 *
 *
 * @example
 * // Postman
 * // POST http://localhost:3000/api/library/auto-insert
 * // Body (raw JSON):
 * // {
 * //   "videoUrl": "https://youtu.be/dQw4w9WgXcQ"
 * // }
 *
 * // 성공 응답(예)
 * // {
 * //   "platform": "youtube",
 * //   "platformInfo": { ... },
 * //   "data": { ...수집된 정규화 필드... }
 * // }
 *
 * // 오류 응답(예)
 * // 400: { "error": "videoUrl is required" }
 * // 400: { "error": "Unsupported or unrecognized platform URL" }
 * // 500: { "error": "<internal error message>" }
 */
exports.autoInsertBlankFromLibray = async (req, res) => {
    //const videoURL = req.body.videoUrl;
    const { url } = req.query;
    let   autoInsertData;
    try {
        // 1. 플랫폼 분기 처리 
        const platformInfo = libraryService.detectPlatform(url);
        console.log(platformInfo)
        // 2. 분기 처리 기반 proxy data crowling request
        switch(platformInfo.platform) {
            case 'youtube' :
                autoInsertData = await libraryService.retrieveYoutubeVideo(platformInfo);
                //console.log(autoInsertData);
                break;
            case 'instagram' :
                
                break;
            case 'tiktok' :
                
                break;
            default :
                break;
        }

        // 3. DTO 생성
        const autoInsertResDTO = await libraryService.makeAutoInsertResDTO(autoInsertData);

        // 3. response 생성
        res.status(200).json({
            success: true,
            message: '자동 입력 데이터 조회 성공',
            data: autoInsertResDTO
        });

        // 4. 채널 조회 요청
        let creatorTableEntity;
        switch(platformInfo.platform) {
            case 'youtube' :
                const channelID = autoInsertData.channel_id;
                const youtubeChannelData = await libraryService.getYoutubeChannelData(channelID);
                
                console.log(channelInfo);
                break;
            case 'instagram' :
                
                break;
            case 'tiktok' :
                
                break;
            default :
                break;
        }
        

        // 5. 채널 유무 확인
        const channelID = autoInsertData.channel_id;
        const creatorIdxResult = await gerneralService.selectCreatorByID(channelID);

        // 6. 채널 Insert or Update
        if (creatorIdxResult !== false) {
            // Update
            console.log('update is called');

        } else {
            // Insert
            console.log('insert is called');
        }


        // 7. post 테이블 유무 확인

        // 8. 비디오 Insert or Update

        
    }
    catch(err) {
        logger.error('[ Search Controller ,integreatedSearch ERROR] :: ' + err.stack);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message
        });
    }

}