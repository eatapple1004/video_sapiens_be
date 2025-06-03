const db = require("../config/database"); // DB 연결 모듈 가정
const logger = require("../utils/logger");

exports.insertAnalyzeRequest = async ({ userIdx, videoId, platform, originalUrl }) => {
  const query = `
    INSERT INTO analyze_request (user_idx, video_id, platform, original_url, requested_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING idx;
  `;
  const result = await db.query(query, [userIdx, videoId, platform, originalUrl]);
  logger.info("analyze_request idx :: " + result.rows[0].idx);
  return result.rows[0].idx;
};