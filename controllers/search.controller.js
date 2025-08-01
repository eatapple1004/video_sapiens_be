const logger = require('../utils/logger');
const searchService = require("../services/search.service");
const SearchResultVO = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');
/**
 * 통합 검색 컨트롤러
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.integreatedSearch = async (req, res) => {
    logger.info('get integrated request');
    try {
        // 1. request 데이터 파싱
        const userInputIntegarted = await searchService.parseIntegratedQuery(req.query);
        
        // 2. 통합 검색 where절 생성
        const integratedWhereClause = await searchService.makeIntegratedWhereClause(userInputIntegarted);

        // 3. search result DB 조회
        const searchResultVOList = await searchService.getSearchResult(integratedWhereClause);

        // 4. analyzed result DB 조회
        const analyzedResultVOList = await searchService.getAnalyzedResult(integratedWhereClause);

        // 5. 검색 결과 & 분석 결과 데이터 파싱
        const responsePayload = await searchService.mergeSearchAndAnalyzedResult(
            searchResultVOList,
            analyzedResultVOList
        );

        // 6. 통합 검색 결과 response 반환
        res.status(200).json({
            success: true,
            message: '통합 검색 조회 성공',
            data: responsePayload
        });

    }
    catch(err) {
        logger.error('[Integrated Search, Controller ,integreatedSearch ERROR] :: ' + err.stack);
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
        const analyzedResultVOList = await searchService.getAnalyzedResult(filterWhere);

        // 5. 검색 결과 & 분석 결과 데이터 파싱
        const responsePayload = await searchService.mergeSearchAndAnalyzedResult(
            searchResultVOList,
            analyzedResultVOList
        );

        // 6. 필터 검색 결과 response 반환
        res.status(200).json({
            success: true,
            message: '필터 검색 조회 성공',
            data: responsePayload
        });
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



/**
 * 태그 종류 목록 조회 컨트롤러
 * @route GET /tags
 * @returns {JSON} topicTags, genreTags, formatTags
 */
 exports.getAllTags = async (req, res) => {
    try {
      const tagData = await searchService.getAllTagLists();
      res.status(200).json({
        success: true,
        message: '태그 목록 조회 성공',
        data: tagData
      });
    } catch (err) {
      logger.error('[search.controller.getAllTags] ERROR: ' + err.stack);
      res.status(500).json({
        success: false,
        message: '태그 목록 조회 실패',
        error: err.message
      });
    }
};

/**
 * integrated와 tag Searching 둘다 가능한 기능
 * @route GET /search
 * @param {Query} req.query : 사용자 지정 & 입력 
 * @returns {Object} reelsData  : 조건에 부합 하는 릴스 리스트
 */
exports.searchReels = async (req, res) => {
    try {
        // 1. req.query 데이터 파싱
        const parsedData = await searchService.parseUserInputQuery(req.query);
        
        // 2. where 절 생성
        const whereClause = await searchService.makeUserInputWhereClause(parsedData);
        
        // 3. search result 조회
        const searchResultVOList = await searchService.getSearchResult(whereClause);

        // 4. analyzed result 조회
        const analyzedResultVOList = await searchService.getAnalyzedResult(whereClause);

        // 5. reelsData 생성
        const responsePayload = await searchService.mergeSearchAndAnalyzedResult(
            searchResultVOList,
            analyzedResultVOList
        );

        // 6. response 반환
        res.status(200).json({
            success: true,
            message: '검색 조회 성공',
            data: responsePayload
        });
    }
    catch(err) {
        logger.error('[search.controller.searchReels] ERROR: ' + err.stack);
        res.status(500).json({
            success: false,
            message: '검색 목록 조회 실패',
            error: err.message
        });
    }
}