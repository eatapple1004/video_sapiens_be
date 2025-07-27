const db     = require("../config/database");
const logger = require("../utils/logger");


/**
 * 통합 검색 - 데이터베이스 조회 래포지토리
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON} ReelsArray : DB조회 결과 - 48개
 */
exports.getIntegratedSearchReels = async (userInputWord) => {

    try{
        const query = `
            SELECT *
            FROM post_search

        `;
        const result = await db.query(query, [userInputWord]);
        
        return result.row; 
    }
    catch(err) {

    }

}


/**
 * 통합 검색 - 데이터베이스 조회 래포지토리
 * @param {string} filterQuery : 사용자 맞춤 쿼리
 * @returns {JSON} ReelsArray : DB조회 결과 - 48개
 */
 exports.getFilterSearchReels = async (filterQuery) => {

    try{
        const result = await db.query(filterQuery);
        return result.rows;
    }
    catch(err) {
        logger.error('[Tag Search, Repository, getFilterSearchReels ERROR] :: ' + err.stack);
        throw err;
    }

}


exports.getSearchResultRepo = async (filterWhere) => {
    const query = `
      SELECT 
        p.thumbnail_url,
        p.like_count,
        p.video_view_count,
        c.profile_image_url,
        c.creator_username
      FROM analyzed_video a
      JOIN post p ON a.video_idx = p.idx
      JOIN creator c ON p.creator_idx = c.idx
      ${filterWhere}
      ORDER BY p.like_count DESC
      LIMIT 48;
    `;
  
    try {
      const result = await pool.query(query);
      return result.rows;
    }
    catch(err) {
      logger.error('[search.repository.findSearchResult] ERROR:' + err.stack);
      throw err;
    }
  };
  
  exports.getAnalyzedResultRepo = async (filterWhere) => {
    const query = `
      SELECT 
        pf.platform_icon_url,
        p.title,
        c.profile_image_url,
        c.creator_username,
        c.follower_count AS followers,
        p.play_count,
        p.video_view_count AS view_count,
        p.like_count,
        p.comment_count,
        p.caption,
        p.audio_info,
        p.topic AS topic_tag,
        p.genre AS genre_tag,
        p.format AS format_tag,
        a.summary,
        a.visual_hook_summary,
        a.sound_hook_summary,
        a.text_hook_summary
      FROM analyzed_video a
      JOIN post p ON a.video_idx = p.idx
      JOIN creator c ON p.creator_idx = c.idx
      JOIN platform pf ON c.platform_id = pf.id
      ${filterWhere}
      ORDER BY p.like_count DESC
      LIMIT 48;
    `;
  
    try {
      const result = await pool.query(query);
      return result.rows;
    }
    catch (err) {
      logger.error('[search.repository.getAnalyzedResultRepo] ERROR: ' + err.stack);
      throw err;
    }
  };
  