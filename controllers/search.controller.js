const logger = require('../utils/logger');
const searchService = require("../services/search.service")

/**
 * 통합 검색 컨트롤러
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.integreatedsearch = async (req, res) => {
    const { userInputWord } = req.body;

    try {
        // 1. 릴스 검색

        // 2. 데이터 파싱

        // 3. send back response

    }
    catch(err) {

    }

}