const db     = require("../config/database");
const logger = require("../utils/logger");

/**
 * Creator 테이블에서 ig_id로 idx 조회
 * @param {string} ig_id - Instagram 고유 ID
 * @returns {number|null} 해당 크리에이터의 idx (없으면 null)
 */
 exports.selectCreatorByID = async (ig_id) => {
    try {
        const query = `SELECT idx FROM creator WHERE ig_id = $1`;
        const result = await db.query(query, [ig_id]);
    
        if (result.rows.length > 0) {
            return result.rows[0].idx;
        } else {
            return false; // 존재하지 않음
        }
    } catch (err) {
        logger.error('[selectCreatorByID ERROR] ::', err.stack);
        throw err; // 호출한 측에서 처리할 수 있도록 throw
    }
};