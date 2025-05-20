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

async function registerUser(email, password) {
    try {
        console.log("📡 PostgreSQL 연결 성공!");

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

        const result = await client.query(query, values);
        console.log(`✅ 회원가입 성공 (User ID: ${result.rows[0].id})`);
    } catch (error) {
        console.error("❌ 회원가입 오류:", error);
    } finally {
        
    }
}

module.exports = {
  isUserExists,
  registerUser
};
