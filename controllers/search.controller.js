const logger = require('../utils/logger');
const searchService = require("../services/search.service")
const SearchResultVO = require('../model/searchResultVO')
/**
 * 통합 검색 컨트롤러
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.integreatedSearch = async (req, res) => {
    const { userInputWord } = req.body;

    try {
        // 1. 릴스 검색

        // 2. 데이터 파싱

        // 3. send back response

    }
    catch(err) {

    }
}


/**
 * 테그 검색 컨트롤러
 * @param {Query} req.query : 사용자 입력 검색어
 * @returns {Object} reelsData  : 조건에 부합 하는 릴스 리스트
 */
 exports.tagSearch = async (req, res) => {
    
    try {
        // 1. 검색시 받는 데이터 파싱
        const parsedFilterData = await searchService.parseUserInputFilter(req.query);
       
        // 2. 필터 데이터 전용 where절 작성
        const filterWhere = await searchService.makeFilterWhereClause(parsedFilterData);
        
        // 3. DB에서 검색 결과 받아오기
        const searchResultVOList = await searchService.getSearchResult(filterWhere);

        // 4. DB에서 분석 결과 받아오기 
        const analyzedResult = await searchService.getReelsDataByTagFilter(filterWhere);

        // 5. 검색 결과 & 분석 결과 데이터 파싱


        // 6. send back response   
        
    }
    catch(err) {
        logger.error('[Tag Search, Controller ,tagSearch ERROR] :: ' + err.stack);
        res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
        });
    }
}