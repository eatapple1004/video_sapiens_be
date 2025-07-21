const logger = require('../utils/logger');
const searchService = require("../services/search.service")

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
 * @param {JSON Array} : 사용자 입력 검색어
 * @returns {JSON Array} reelsData  : 조건에 부합 하는 릴스 리스트
 */
 exports.tagSearch = async (req, res) => {

    try {
        // 1. 검색시 받는 데이터 파싱
        const parsedFilterData = await searchService.parseUserInputFilter(req.body);

        // 2. 필터 데이터 전용 쿼리 작성
        
        

        // 3. send back response

    }
    catch(err) {

    }
}