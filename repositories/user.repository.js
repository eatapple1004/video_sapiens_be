const pool = require("../config/database");
const logger = require("../utils/logger"); // 선택: winston logger 사용 시

/**
 * 이메일이 이미 존재하는지 확인하는 함수
 * @param {string} email - 사용자 이메일
 * @returns {Promise<boolean>} - 중복 여부 (true = 중복됨)
 */
async function isUserExists(email) {
    try {
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await pool.query(query, [email]);

        return result.rows.length > 0;
    } catch (error) {
        logger?.error(`❌ 사용자 중복 확인 오류: ${error.message}`);
        throw error;
    }
}

module.exports = {
  isUserExists,
};
