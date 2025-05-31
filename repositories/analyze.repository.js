const db = require("../config/database"); // DB 연결 모듈 가정

exports.insertAnalyzeRequest = async ({ userId, videoId, platform, originalUrl }) => {
  const query = `
    INSERT INTO analyze_request (user_id, reels_id, platform, original_url, request_time)
    VALUES (?, ?, ?, ?, NOW())
    RETURNING id;
  `;
  const [result] = await db.query(query, [userId, videoId, platform, originalUrl]);
  return result[0].id;
};