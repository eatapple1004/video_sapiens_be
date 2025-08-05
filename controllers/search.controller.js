const logger = require('../utils/logger');
const searchService    = require("../services/search.service");
const SearchResultVO   = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');

/**
 * 통합 검색 컨트롤러 함수
 * 
 * @route GET /search/integrated
 * 
 * @param {import('express').Request} req  - HTTP 요청 객체, req.query에 사용자 입력 검색어 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {Promise<void>} 통합 검색 결과를 JSON 형식으로 응답, 에러 시 로그 기록
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
        logger.error('[ Search Controller ,integreatedSearch ERROR] :: ' + err.stack);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message
        });
    }
}


/**
 * 태그 검색 컨트롤러 함수
 * 
 * @route GET /search/tag
 * 
 * @param {import('express').Request} req  - HTTP 요청 객체, req.query에 사용자 입력 검색어 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {Promise<void>} 필터링된 릴스 리스트를 JSON 형식으로 응답, 에러 시 500 상태와 에러 메시지 반환
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
        logger.error('[ Search Controller ,tagSearch ERROR] :: ' + err.stack);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message
        });
    }
}



/**
 * 태그 종류 목록 조회 컨트롤러
 * 
 * @route GET /tag/list
 * 
 * @param {import('express').Request} req - HTTP 요청 객체
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {Promise<void>} topicTags, genreTags, formatTags를 포함한 JSON 응답 반환, 에러 시 500 상태 및 에러 메시지 반환
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
 * 통합 및 태그 검색 기능 컨트롤러
 * 
 * @route GET /search
 * 
 * @param {import('express').Request} req - HTTP 요청 객체, req.query에 사용자 입력 검색어 포함
 * @param {import('express').Response} res - HTTP 응답 객체
 * 
 * @returns {Promise<void>} 조건에 부합하는 릴스 리스트를 JSON 형식으로 응답, 에러 시 500 상태 및 에러 메시지 반환
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