const logger = require("../utils/logger");
const searchRepo = require("../repositories/search.repository");
const SearchResultVO = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');
const MergedSearchAndAnalyzedResultDTO = require('../model/MergedSearchAndAnalyzedResultDTO');


/**
 * GET 요청에서 integrated 파라미터 추출
 * 예: /search/integrated?integratedSearch = blog 
 * @param {Request} reqQuery - Express 요청 query
 * @returns {string} - 통합 검색어
 */
exports.parseIntegratedQuery = async (reqQuery) => {
  const { integratedSearch } = reqQuery;

  if (!integratedSearch || typeof integratedSearch !== 'string') {
    throw new Error('유효하지 않은 integrated 파라미터입니다.');
  }

  // 필요 시 필터링 또는 전처리 가능
  logger.info('통합검색어 :: ' + integratedSearch.trim());
  return integratedSearch.trim();
}


/**
 * userInputIntegarted을 포함 하고 있는 분석된 영상 찾기
 *                  < 탐색 범위 >
 * 1. analyzed_video : table
 * (column) topic_tag, genre_tag, format_tag, title, summary, visual_hook_summary, sound_hook_summary, text_hook_summary
 *  
 * 2. post : table
 * (column) caption
 * @param {String} userInputIntegarted - 유저 입력 단어
 * @returns {string} - 통합 검색어
 */
exports.makeIntegratedWhereClause = async (userInputIntegarted) => {
  try {
    const keyword = userInputIntegarted.replace(/'/g, "''"); // SQL 인젝션 방지용 작은따옴표 escape

    const whereClause = `
      WHERE
        EXISTS (
          SELECT 1 FROM unnest(a.topic_tag) AS tag WHERE tag ILIKE '%' || '${keyword}' || '%'
        )
        OR EXISTS (
          SELECT 1 FROM unnest(a.genre_tag) AS tag WHERE tag ILIKE '%' || '${keyword}' || '%'
        )
        OR EXISTS (
          SELECT 1 FROM unnest(a.format_tag) AS tag WHERE tag ILIKE '%' || '${keyword}' || '%'
        )
        OR a.title ILIKE '%' || '${keyword}' || '%'
        OR a.summary ILIKE '%' || '${keyword}' || '%'
        OR a.visual_hook_summary ILIKE '%' || '${keyword}' || '%'
        OR a.sound_hook_summary ILIKE '%' || '${keyword}' || '%'
        OR a.text_hook_summary ILIKE '%' || '${keyword}' || '%'
        OR p.caption ILIKE '%' || '${keyword}' || '%'
    `;

    return whereClause;
  } catch (err) {
    logger.error('makeIntegratedWhereClause Error:', err);
    throw new Error('통합 검색 WHERE 절 생성 실패');
  }
}


/**
 * 테그 검색 데이터 정리 및 파싱
 * @param {Object} userInputFilter : 사용자 입력 검색어
 * @returns {Object} cleanFilter
 */
 exports.parseUserInputFilter = async (userInputFilter) => {
    
    try {
        const parsedFilterData = {};
    
        for (const [key, value] of Object.entries(userInputFilter)) {
          if (value == null) continue;
    
          // 빈 문자열 제거
          if (typeof value === 'string' && value.trim() === '') continue;
    
          // 배열로 처리해야 할 필드들
          const arrayFields = ['platform', 'topic', 'genre', 'format'];
    
          if (arrayFields.includes(key)) {
            // "ai,tech" → ['ai', 'tech']
            const parsedArray = value.split(',').map(v => v.trim()).filter(v => v !== '');
            if (parsedArray.length > 0) {
              parsedFilterData[key] = parsedArray;
            }
          } else if (['views', 'likes'].includes(key)) {
            // 숫자 파라미터 변환
            const numberValue = parseInt(value);
            if (!isNaN(numberValue)) {
              parsedFilterData[key] = numberValue;
            }
          } else {
            // 일반 문자열 필터
            parsedFilterData[key] = value.trim();
          }
        }
    
        return parsedFilterData;
    
      } catch (err) {
        logger.error("[ Tag Search, parseUserInputFilter ERROR ] :: " + err.stack);
        throw err;
      }
}


/**
 * 테그 검색 필터 전용 WHERE 조건절 생성기 (a. 접두어 포함)
 * @param {Object} parsedFilterData : 사용자 입력 검색어
 * @returns {String} whereClause : WHERE 조건절만 반환
 */
 exports.makeFilterWhereClause = async (parsedFilterData) => {
  try {
    const conditions = [];

    for (const [key, value] of Object.entries(parsedFilterData)) {
      if (key === 'views') {
        conditions.push(`p.video_view_count >= ${value}`);
      } 
      else if (key === 'likes') {
        conditions.push(`p.like_count >= ${value}`);
      } 
      else if (key === 'platform') {
        if (Array.isArray(value)) {
          const platformConditions = value.map(v => `a.platform = '${v}'`);
          conditions.push(`(${platformConditions.join(' OR ')})`);
        } else {
          conditions.push(`a.platform = '${value}'`);
        }
      } 
      else if (['topic', 'genre', 'format'].includes(key)) {
        if (Array.isArray(value) && value.length > 0) {
          const formattedArray = value.map(v => `'${v}'`).join(', ');
          conditions.push(`a.${key}_tag @> ARRAY[${formattedArray}]::text[]`);
        }
      }
    }

    return conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  } catch (err) {
    logger.error("[ Tag Search, makeFilterWhereClause ERROR ] :: " + err.stack);
    throw err;
  }
};

/**
 * @param {Object} filterWhere : where 문
 * @returns {String} whereClause : WHERE 조건절만 반환
 */
exports.getSearchResult = async (filterWhere) => {
  try {
    const rows = await searchRepo.getSearchResultRepo(filterWhere);

    const searchResultVOList = rows.map(row => new SearchResultVO({
      platform_shortcode: row.platform + '_' + row.shortcode,
      thumbnail_url:      row.thumbnail_url,
      like_count:         row.like_count,
      video_view_count:   row.video_view_count,
      profile_image_url:  row.profile_pic_url,
      creator_username:   row.username
    }));

    return searchResultVOList;
  }
  catch(err) {
    logger.error('[search.service.getSearchResult] ERROR: ' + err.stack);
    throw err;
  }
};


/**
 * @param {Object} filterWhere : where 문
 * @returns {String} whereClause : WHERE 조건절만 반환
 */
 exports.getAnalyzedResult = async (filterWhere) => {
  try {
    const rows = await searchRepo.getAnalyzedResultRepo(filterWhere);

    const analyzedResultVOList = rows.map(row => new AnalyzedResultVO({
      platform_shortcode: row.platform + '_' + row.shortcode,
      platform_icon_url:  row.platform_icon_url,
      title:              row.title,
      profile_image_url:  row.profile_pic_url,
      creator_username:   row.username,
      followers:          row.followers,
      
      play_count:     row.play_count,
      view_count:     row.view_count,
      like_count:     row.like_count,
      comment_count:  row.comment_count,
      
      caption:    row.caption,
      audio_info: row.song_name + ', ' + row.artist_name,
      
      topic_tag:  row.topic_tag,
      genre_tag:  row.genre_tag,
      format_tag: row.format_tag,
      
      summary:              row.summary,
      visual_hook_summary:  row.visual_hook_summary,
      sound_hook_summary:   row.sound_hook_summary,
      text_hook_summary:    row.text_hook_summary
    }));

    return analyzedResultVOList;
  } catch (err) {
    logger.error('[search.service.getAnalyzedResult] ERROR: ' + err.stack);
    throw err;
  }
};


/**
 * 검색 결과 VO 리스트와 분석 결과 VO 리스트를 병합
 * @param {SearchResultVO[]} searchResultVOList 
 * @param {AnalyzedResultVO[]} analyzedResultVOList 
 * @returns {MergedSearchAndAnalyzedResultDTO[]} 병합된 DTO 리스트
 */
 exports.mergeSearchAndAnalyzedResult = async (searchResultVOList, analyzedResultVOList) => {
  try {
    if (searchResultVOList.length !== analyzedResultVOList.length) {
      logger.warn(
        `[mergeSearchAndAnalyzedResult] 리스트 길이 불일치: search=${searchResultVOList.length}, analyzed=${analyzedResultVOList.length}`
      );
    }

    const combinedList = searchResultVOList.map((searchVO, idx) => {
      const analyzedVO = analyzedResultVOList[idx];
      return new MergedSearchAndAnalyzedResultDTO({
        searchResult: searchVO,
        analyzedResult: analyzedVO
      });
    });

    return combinedList;
  } catch (err) {
    logger.error('[search.service.mergeSearchAndAnalyzedResult] ERROR: ' + err.stack);
    throw err;
  }
};


/**
 * 테그 검색 필터 전용 쿼리문 작성
 * @param {Object} parsedFilterData : 사용자 입력 검색어
 * @returns {String} filterQuery 전체 SQL 문자열
 */
exports.makeFilterQuery = async (parsedFilterData) => {
  try {
    const conditions = [];

    for (const [key, value] of Object.entries(parsedFilterData)) {
        if (key === 'views') { conditions.push(`view_count >= ${value}`); } 
        else if (key === 'likes') { conditions.push(`like_count >= ${value}`); } 
        else if (key === 'platform') {
            if (Array.isArray(value)) {
                const platformConditions = value.map(v => `platform = '${v}'`);
                conditions.push(`(${platformConditions.join(' OR ')})`);
            } 
            else {
                conditions.push(`platform = '${value}'`);
            }
        } 
        else if (['topic', 'genre', 'format'].includes(key)) {
            if (Array.isArray(value) && value.length > 0) {
                const formattedArray = value.map(v => `'${v}'`).join(', ');
                conditions.push(`${key} @> ARRAY[${formattedArray}]::text[]`);
            }
        }
      }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const filterQuery = `
        SELECT *
        FROM post_search
        ${whereClause}
        ORDER BY like_count DESC
        LIMIT 48;
    `.trim();

    return filterQuery;

  } catch (err) {
    logger.error("[ Tag Search, makeFilterQuery ERROR ] :: " + err.stack);
    throw err;
  }
};


/**
 * 테그 검색 필터 전용 쿼리문 작성
 * @param {Object} parsedFilterData : 사용자 입력 검색어
 * @returns {String} filterQuery 전체 SQL 문자열
 */
 exports.getReelsDataByTagFilter = async (filterQuery) => {
    
    try{
        const reelsData = await searchRepo.getFilterSearchReels(filterQuery);
        logger.info('[reelsData] :: ' + JSON.stringify(reelsData, null, 2));
        return reelsData;
    }
    catch(err) {
        logger.error("[ Tag Search, getReelsDataByTagFilter ERROR ] :: " + err.stack);
        throw err;
    }
}


/**
 * 플랫폼별 태그 목록 조회 서비스
 * @returns {Object} { topicTags, genreTags, formatTags }
 */
 exports.getAllTagLists = async () => {
  try {
    const tagLists = await searchRepo.getAllTags();
    return tagLists;
  } catch (err) {
    logger.error('[search.service.getAllTagLists] ERROR: ' + err.stack);
    throw err;
  }
};