const pool     = require("../config/database");
const logger   = require("../utils/logger");


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
        const result = await pool.query(query, [userInputWord]);
        
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
        const result = await pool.query(filterQuery);
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
        a.platform,
        p.shortcode,
        p.thumbnail_url,
        p.like_count,
        p.video_view_count,
        c.profile_pic_url,
        c.username
      FROM analyzed_video a
      JOIN post p ON a.video_idx = p.idx
      JOIN creator c ON p.creator_idx = c.idx
      ${filterWhere}
      ORDER BY p.like_count DESC
      LIMIT 50;
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
        a.platform,
        p.shortcode,
        pf.platform_icon_url,
        a.title,
        c.profile_pic_url,
        c.username,
        c.followers,
        p.video_view_count,
        p.video_view_count AS view_count,
        p.like_count,
        p.comment_count,
        p.caption,
        p.song_name,
        p.artist_name,
        a.topic_tag,
        a.genre_tag,
        a.format_tag,
        a.summary,
        a.visual_hook_summary,
        a.sound_hook_summary,
        a.text_hook_summary
      FROM analyzed_video a
      JOIN post p ON a.video_idx = p.idx
      JOIN creator c ON p.creator_idx = c.idx
      JOIN platform pf ON c.platform = pf.platform_name
      ${filterWhere}
      ORDER BY p.like_count DESC
      LIMIT 50;
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
  


exports.getAllTags = async () => {
  const topicQuery = `
      SELECT LOWER(TRIM(tag)) AS tag
      FROM (
          SELECT unnest(topic_tag) AS tag
          FROM analyzed_video
      ) AS unnested
      WHERE tag IS NOT NULL AND TRIM(tag) <> ''
      GROUP BY LOWER(TRIM(tag))
      ORDER BY COUNT(*) DESC;
  `;
  const genreQuery = `
      SELECT LOWER(TRIM(tag)) AS tag
      FROM (
          SELECT unnest(genre_tag) AS tag
          FROM analyzed_video
      ) AS unnested
      WHERE tag IS NOT NULL AND TRIM(tag) <> ''
      GROUP BY LOWER(TRIM(tag))
      ORDER BY COUNT(*) DESC;
  `;
  const formatQuery = `
      SELECT LOWER(TRIM(tag)) AS tag
      FROM (
          SELECT unnest(format_tag) AS tag
          FROM analyzed_video
      ) AS unnested
      WHERE tag IS NOT NULL AND TRIM(tag) <> ''
      GROUP BY LOWER(TRIM(tag))
      ORDER BY COUNT(*) DESC;
  `;

  try {
    const [topicResult, genreResult, formatResult] = await Promise.all([
    pool.query(topicQuery),
    pool.query(genreQuery),
    pool.query(formatQuery)
    ]);

    return {
      topicTags: topicResult.rows.map(row => row.tag),
      genreTags: genreResult.rows.map(row => row.tag),
      formatTags: formatResult.rows.map(row => row.tag)
    };
  } catch (err) {
      logger.error('[search.repository.getAllTags] ERROR: ' + err.stack);
      throw err;
  }
};


// search.repository.js
exports.findSimilarCandidatesBatch = async (tokens, limitPerToken = 8) => {
  if (!Array.isArray(tokens) || tokens.length === 0) return {};

  const sql = `
    WITH toks AS (
      SELECT t.orig,
             normalize_token(t.orig) AS key
      FROM UNNEST($1::text[]) WITH ORDINALITY AS t(orig, ord)
    ),
    ranked AS (
      SELECT
        tk.orig,
        l.display AS word,
        l.key,
        similarity(l.key, tk.key) AS trigram_sim,
        l.freq,
        ROW_NUMBER() OVER (
          PARTITION BY tk.orig
          ORDER BY similarity(l.key, tk.key) DESC, l.freq DESC, l.display ASC
        ) AS rn
      FROM toks tk
      JOIN search_lexicon l ON l.key % tk.key
      LEFT JOIN search_stopword s ON s.key = l.key
      WHERE s.key IS NULL
    )
    SELECT orig, word, key, trigram_sim, freq
    FROM ranked
    WHERE rn <= $2
    ORDER BY orig, rn;
  `;
  const { rows } = await pool.query(sql, [tokens, limitPerToken]);

  // map으로 변환
  const out = {};
  for (const r of rows) {
    if (!out[r.orig]) out[r.orig] = [];
    out[r.orig].push(r);
  }
  return out; // { "iphon":[{word,...},...], "camra":[...], ... }
};
