const db     = require("../config/database");
const logger = require("../utils/logger");


/**
 * 통합 검색 - 데이터베이스 조회 래포지토리
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON} ReelsArray : DB조회 결과 - 48개
 */
exports.getIntegratedSearchReels = async (userInputWord) => {

    try{
        const query = `
            SELECT *
            FROM post_search

        `;
        const result = await db.query(query, [userInputWord]);
        
        return result.row; 
    }
    catch(err) {

    }

}


/**
 * 통합 검색 - 데이터베이스 조회 래포지토리
 * @param {string} filterQuery : 사용자 맞춤 쿼리
 * @returns {JSON} ReelsArray : DB조회 결과 - 48개
 */
 exports.getFilterSearchReels = async (filterQuery) => {

    try{
        const result = await db.query(filterQuery);
        return result.rows;
    }
    catch(err) {
        logger.error('[getFilterSearchReels ERROR] :: ' + err.stack);
        throw err;
    }

}