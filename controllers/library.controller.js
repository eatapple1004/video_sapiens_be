const logger = require('../utils/logger');
const searchService = require("../services/search.service");
const libraryService = require("../services/library.service");
const SearchResultVO = require('../model/searchResultVO');
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
 * Library Auto Insert Blank
 * @param {string} videoUrl - 예: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 * @returns {JSON} 
 */
exports.autoInsertBlankFromLibray = async (req, res) => {
    const videoURL = req.body.videoUrl;
    try {
        // 1. 플랫폼 분기 처리 
        const platformInfo = libraryService.detectPlatform(videoURL);
        // 2. 분기 처리 기반 proxy data crowling request
        switch(platformInfo.platform) {
            case 'youtube' :
                
                break;
            case 'instagram' :
                
                break;
            case 'tiktok' :
                
                break;
            default :
                break;
        }
    }
    catch(err) {

    }

}