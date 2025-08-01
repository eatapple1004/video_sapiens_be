const pool   = require("../config/database");
const logger = require("../utils/logger");

exports.getUserMarkListRepo = async (userEmail) => {
    
    const query = `
        select mark_list
        from users
        where email = $1
    `;

    try {
        const result = await pool.query(query, [userEmail]);
        console.log(userEmail)
        console.log(result.rows)
        return result.rows[0].mark_list;
    } catch (error) {
        logger?.error(`유저 마크 비디오 조회 오류: ${error.stack}`);
        throw error;
    }
}