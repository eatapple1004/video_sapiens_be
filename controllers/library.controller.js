const logger = require('../utils/logger');
//const searchService = require("../services/search.service");
const libraryService = require("../services/library.service");
const SearchResultVO = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');
/**
 * 통합 검색 컨트롤러
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.retrieveCheckedMarkedVideos = async (req, res) => {
   
    try {
        // 1. 라이브러리 유저 데이터
        const userEmail = req.userEmail;

        // 2. 유저 mark_list 번호 가져 오기
        const markList = await libraryService.getUserMarkListService(userEmail);

    }
    catch(err) {
        logger.error('[Library, Controller ,retrieveCheckedMarkedVideos ERROR] :: ' + err.stack);
    }
}

