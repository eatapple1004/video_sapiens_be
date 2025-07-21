const logger = require("../utils/logger");
const searchRepo = require("../repositories/search.repository");

/**
 * 통합 검색 - 데이터베이스 조회 서비스
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON} ReelsArray : DB조회 결과 - 48개
 */
exports.integratedSearchReels = async (userInputWord) => {

    try{
        // 데이터 베이스 조회
        let reelsData;

        return reelsData
    }
    catch(err) {

    }
}

/**
 * 통합 검색 - 데이터 정리 및 파싱
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.parseReelsData = async (reelsData) => {
    
    try{

    }
    catch(err) {

    }
}


/**
 * 테그 검색 데이터 정리 및 파싱
 * @param {Object} userInputFilter : 사용자 입력 검색어
 * @returns {Object} cleanFilter
 */
 exports.parseUserInputFilter = async (userInputFilter) => {
    
    try {
        const parsedFilterData = {};
    
        for (const [key, value] of Object.entries(userInputFilter)) {
          if (value == null) continue;
    
          // 빈 문자열 제거
          if (typeof value === 'string' && value.trim() === '') continue;
    
          // 배열로 처리해야 할 필드들
          const arrayFields = ['topic', 'genre', 'format'];
    
          if (arrayFields.includes(key)) {
            // "ai,tech" → ['ai', 'tech']
            const parsedArray = value.split(',').map(v => v.trim()).filter(v => v !== '');
            if (parsedArray.length > 0) {
              parsedFilterData[key] = parsedArray;
            }
          } else if (['views', 'likes'].includes(key)) {
            // 숫자 파라미터 변환
            const numberValue = parseInt(value);
            if (!isNaN(numberValue)) {
              parsedFilterData[key] = numberValue;
            }
          } else {
            // 일반 문자열 필터
            parsedFilterData[key] = value.trim();
          }
        }
    
        return parsedFilterData;
    
      } catch (err) {
        logger.error("[ Tag Search, parseUserInputFilter ERROR ] :: " + err.stack);
        throw err;
      }
}


/**
 * 테그 검색 필터 전용 쿼리문 작성
 * @param {Object} parsedFilterData : 사용자 입력 검색어
 * @returns {String} filterQuery 전체 SQL 문자열
 */
exports.makeFilterQuery = async (parsedFilterData) => {
  try {
    const conditions = [];

    for (const [key, value] of Object.entries(parsedFilterData)) {
      if (key === 'views') {
        conditions.push(`view_count >= ${value}`);
      } else if (key === 'likes') {
        conditions.push(`like_count >= ${value}`);
      } else if (key === 'platform') {
        conditions.push(`platform = '${value}'`);
      } else if (['topic', 'genre', 'format'].includes(key)) {
        if (Array.isArray(value) && value.length > 0) {
          const formattedArray = value.map(v => `'${v}'`).join(', ');
          conditions.push(`${key} @> ARRAY[${formattedArray}]::text[]`);
        }
      }
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const filterQuery = `
      SELECT *
      FROM post_search
      ${whereClause}
      ORDER BY like_count DESC
      LIMIT 100;
    `.trim();

    return filterQuery;

  } catch (err) {
    logger.error("[ Tag Search, makeFilterQuery ERROR ] :: " + err.stack);
    throw err;
  }
};


/**
 * 테그 검색 필터 전용 쿼리문 작성
 * @param {Object} parsedFilterData : 사용자 입력 검색어
 * @returns {String} filterQuery 전체 SQL 문자열
 */
 exports.getReelsDataByTagFilter = async (filterQuery) => {
    
    try{
        const reelsData = await searchRepo.getFilterSearchReels(filterQuery);
        logger.info('[reelsData] :: ' + JSON.stringify(reelsData, null, 2));
        return reelsData;
    }
    catch(err) {
        logger.error("[ Tag Search, getReelsDataByTagFilter ERROR ] :: " + err.stack);
        throw err;
    }
}