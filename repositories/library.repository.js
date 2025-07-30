const pool   = require("../config/database");
const logger = require("../utils/logger");

exports.getUserMarkListRepo = async (userEmail) => {
    
    const query = `
        select mark_list
        from users
        where email = ${userEmail}
    `;

    try {
        const markLikst = await db.query(query);
        return markLikst;
        
    } catch (error) {
        logger?.error(`유저 마크 비디오 조회 오류: ${error.stack}`);
        throw error;
    }
}