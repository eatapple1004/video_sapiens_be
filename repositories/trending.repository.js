const pool   = require("../config/database");

exports.getTop300PostIdxs = async () => {
  const result = await pool.query(`
    SELECT idx, viral_score
    FROM post
    WHERE viral_score IS NOT NULL
    ORDER BY viral_score DESC
    LIMIT 300
  `);
  return result.rows;
};

/**
 * @param {string[]} idxList - 조회할 post idx 배열 (문자열 배열)
 * @returns {Promise<Array>} - post row 배열
 */
exports.getPostsByIdxList = async (idxList) => {
    if (!Array.isArray(idxList) || idxList.length === 0) return [];

    const placeholders = idxList.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
        SELECT 
        idx,
        shortcode,
        thumbnail_url,
        like_count,
        video_view_count,
        comment_count,
        owner_username
        FROM post
        WHERE idx IN (${placeholders})
    `;

    const result = await pool.query(query, idxList);
    return result.rows;
}