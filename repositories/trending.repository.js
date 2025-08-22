const pool   = require("../config/database");

exports.getTop300Posts = async () => {
  const result = await pool.query(`
    SELECT idx, viral_score
    FROM post
    WHERE viral_score IS NOT NULL
    ORDER BY viral_score DESC
    LIMIT 300
  `);
  return result.rows;
};
