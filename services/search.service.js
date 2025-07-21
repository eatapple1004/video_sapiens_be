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
 * @returns {Object} 
 */
 exports.parseUserInputFilter = async (userInputFilter) => {
    
    try{
        const cleanFilter = {};

        for (const [key, value] of Object.entries(userInputFilter)) {
            // null / undefined 제거
            if (value == null) continue;

            // 빈 배열 제거
            if (Array.isArray(value) && value.length === 0) continue;

            // string 빈 문자열 제거
            if (typeof value === 'string' && value.trim() === '') continue;

            cleanFilter[key] = value;
        }

        return cleanFilter;
    }
    catch(err) {
        logger.error("[ Tag Search]");
    }
}
