const logger = require("../utils/logger");
const searchRepo = require("../repositories/search.repository");
const libraryRepo = require("../repositories/library.repository");
const SearchResultVO = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');
const MergedSearchAndAnalyzedResultDTO = require('../model/MergedSearchAndAnalyzedResultDTO');

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