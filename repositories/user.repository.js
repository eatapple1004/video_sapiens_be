const db     = require("../config/database");
const logger = require("../utils/logger");

/**
 * 이메일이 이미 존재하는지 확인하는 함수
 * @param {string} email - 사용자 이메일
 * @returns {Promise<boolean>} - 중복 여부 (true = 중복됨)
 */
exports.isUserExists = async (email) => {
    try {
        const query = `SELECT * FROM users WHERE email = $1`;
        const result = await db.query(query, [email]);

        return result.rows.length > 0;
    } catch (error) {
        logger?.error(`❌ 사용자 중복 확인 오류: ${error.message}`);
        throw error;
    }
}

exports.registerUser = async (email, password) => {
    try {
        //console.log("📡 PostgreSQL 연결 성공!");

        // 비밀번호 해싱 (bcrypt 사용)
        const saltRounds = 10;
        //const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 사용자 데이터 삽입
        const query = `
            INSERT INTO users (email, password_hash) 
            VALUES ($1, $2) 
            RETURNING idx;
        `;
        const values = [email, password];

        const result = await db.query(query, values);
        logger.info(`✅ 회원가입 성공 (User ID: ${result.rows[0].id})`);
    } catch (error) {
        logger.error("❌ 회원가입 오류:", error);
    } finally {
        
    }
}

exports.getPasswordHashByEmail = async (email) => {
    try {
        const query = `
            SELECT password_hash 
            FROM users 
            WHERE email = $1
        `;
        const result = await db.query(query, [email]);
  
        if (result.rows.length === 0) {
            logger.warn(`❗ 사용자 없음: ${email}`);
            return null;
        }
  
        //console.log(`📥 비밀번호 해시 조회 성공: ${email}`);
        return result.rows[0].password_hash;
    } catch (error) {
        logger.error(`❌ 비밀번호 해시 조회 오류 (${email}):`, error);
        throw error;
    }
}


exports.getUserIdxByEmail = async (email) => {
    const query = `SELECT idx FROM users WHERE email = $1 LIMIT 1;`;
    const values = [email];
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error("해당 이메일로 등록된 유저가 없습니다.");
    }
  
    return result.rows[0].idx;
};


exports.searchAnalyzedVideoIdxRepo = async (platform, video_code) => {
    const query = `
        select idx
        from analyzed_video
        where platform = $1 AND video_code = $2
    `;
    const values = [platform, video_code];
    try{
        const result = await db.query(query, values);
        return result.rows[0].idx;
    }
    catch(err) {
        logger.error('[user.repository.searchAnalyzedVideoIdxRepo] ERROR: ' + err.stack);
        throw err;
    }
}

exports.markAnalyzedVideoIdxRepo = async (userEmail, analyzedVideoIdx) => {
    const query = `
        UPDATE users
        SET mark_list = CASE 
            WHEN $1 = ANY(mark_list) THEN array_remove(mark_list, $1)
            ELSE mark_list || $1
        END
        WHERE email = $2
        RETURNING
        mark_list,
        CASE
            WHEN $1 = ANY(mark_list) THEN 'removed'
            ELSE 'added'
        END AS action;
    `;
    const values = [String(analyzedVideoIdx), userEmail];
    try{
        const { rows } = await db.query(query, values);
        return {
            mark_list: rows[0]?.mark_list || [],
            action: rows[0]?.action || null
        };
    } 
    catch(err) {
        logger.error('[user.repository.markAnalyzedVideoIdxRepo] ERROR: ' + err.stack);
        return false;
    }
}



exports.addNewUserEmailRepo = async (email) => {
    try {
        const query = `
            INSERT INTO users (email) 
            VALUES ($1) 
            RETURNING idx;
        `;
        const values = [email];

        const result = await db.query(query, values);
        logger.info(`✅ 회원가입 성공 (User ID: ${result.rows[0].id})`);
    } catch (error) {
        logger.error("❌ 회원가입 오류:", error);
    } finally {
        
    }
}