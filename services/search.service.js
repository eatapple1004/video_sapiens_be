const logger     = require("../utils/logger");
const searchRepo = require("../repositories/search.repository");

const SearchResultVO                   = require('../model/searchResultVO');
const AnalyzedResultVO                 = require('../model/analyzedResultVO');
const MergedSearchAndAnalyzedResultDTO = require('../model/MergedSearchAndAnalyzedResultDTO');


/**
 * GET 요청에서 integrated 파라미터를 추출하는 함수
 * 
 * 예: /search/integrated?integratedSearch=blog
 * 
 * @param {import('express').Request['query']} reqQuery - Express 요청의 query 객체
 * 
 * @throws {Error} integratedSearch가 없거나 문자열이 아닐 경우 예외 발생
 * 
 * @returns {Promise<string>} 통합 검색어 (trim 처리된 문자열)
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
 * userInputIntegarted을 포함하는 분석된 영상 조건의 WHERE 절 생성 함수
 * 
 * <탐색 범위>
 * 1. analyzed_video 테이블 (topic_tag, genre_tag, format_tag, title, summary, visual_hook_summary, sound_hook_summary, text_hook_summary 컬럼)
 * 2. post 테이블 (caption 컬럼)
 * 
 * @param {string} userInputIntegarted - 유저 입력 단어
 * 
 * @throws {Error} WHERE 절 생성 중 에러 발생 시 예외 던짐
 * 
 * @returns {Promise<string>} SQL WHERE 절 문자열 반환
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
 * 사용자 입력 검색어를 정리 및 파싱하는 함수
 * 
 * @param {Object} userInputFilter - 사용자 입력 검색어 객체
 * 
 * @throws {Error} 파싱 중 오류 발생 시 예외 던짐
 * 
 * @returns {Promise<Object>} 파싱 및 정리된 필터 객체 반환
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
 * 태그 검색 필터 전용 WHERE 조건절 생성 함수 (a. 접두어 포함)
 * 
 * @param {Object} parsedFilterData - 사용자 입력 검색어 객체
 * 
 * @throws {Error} WHERE 절 생성 중 오류 발생 시 예외 던짐
 * 
 * @returns {Promise<string>} WHERE 조건절 문자열 반환 (조건이 없으면 빈 문자열)
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
      platform_shortcode : row.platform + '_' + row.shortcode,
      thumbnail_url :      row.thumbnail_url,
      like_count :         row.like_count,
      video_view_count :   row.video_view_count,
      profile_image_url :  row.profile_pic_url,
      creator_username :   row.username,
      is_marked :          false
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

/**
 * 테그 검색 데이터 정리 및 파싱
 * @param {Object} userInputFilter : 사용자 입력 검색어
 * @returns {Object} cleanFilter
 */
exports.parseUserInputQuery = async (userInputFilter) => {
  try {
    const parsedFilterData = {};

    for (const [key, value] of Object.entries(userInputFilter)) {
      if (value == null) continue;

      if (typeof value === 'string' && value.trim() === '') continue;

      // 배열 필드 처리
      const arrayFields = ['platform', 'topic', 'genre', 'format'];

      if (arrayFields.includes(key)) {
        const parsedArray = value
          .split(',')
          .map(v => v.trim())
          .filter(v => v !== '');
        if (parsedArray.length > 0) {
          parsedFilterData[key] = parsedArray;
        }

      } else if (['views', 'likes'].includes(key)) {
        // "1000,5000" → { min: 1000, max: 5000 }
        const [minStr, maxStr] = value.split(',').map(v => v.trim());
        const min = parseInt(minStr);
        const max = parseInt(maxStr);

        const range = {};
        if (!isNaN(min)) range.min = min;
        if (!isNaN(max)) range.max = max;

        if (Object.keys(range).length > 0) {
          parsedFilterData[key] = range;
        }

      } else if (key === 'query') {
        // 일반 검색어
        parsedFilterData.query = value.trim();

      } else {
        // 기타 문자열 필터
        parsedFilterData[key] = value.trim();
      }
    }

    return parsedFilterData;
  } catch (err) {
    logger.error('[ Search, parseUserInputQuery ERROR ] :: ' + err.stack);
    throw err;
  }
};


/**
 * SQL WHERE 절 문자열 생성기
 * @param {Object} parsedData - parseUserInputFilter 결과 객체
 * @returns {String} WHERE 절 문자열 (예: "WHERE topic_tag @> ARRAY[...] AND ...")
 */
 exports.makeUserInputWhereClause = async (parsedFilter) => {
  try {
    const conditions = [];

    // 🔐 문자열 이스케이프 처리
    const escapeLiteral = (str) => {
      if (typeof str !== 'string') return null;
      return `'${str.replace(/'/g, "''")}'`;
    };

    // 🔐 배열 이스케이프 처리
    const escapeArray = (arr) => {
      if (!Array.isArray(arr)) return null;
      return arr
        .map(v => escapeLiteral(String(v)))
        .filter(v => v !== null)
        .join(', ');
    };

    // ✅ 1. 배열 필드 유효성 검사 및 where절 생성
    const arrayFields = ['platform', 'topic', 'genre', 'format'];
    for (const field of arrayFields) {
      const value = parsedFilter[field];
      if (field === 'platform') {
        if (Array.isArray(value)) {
            const platformConditions = value.map(v => `a.platform = '${v}'`);
            conditions.push(`(${platformConditions.join(' OR ')})`);
        } 
        else {
            conditions.push(`a.platform = '${value}'`);
        }
      }
      else if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')) {
        const arrayString = escapeArray(value);
        conditions.push(`a.${field}_tag @> ARRAY[${arrayString}]::text[]`);
      }
    }

    // ✅ 2. views, likes 유효성 검사 및 범위 처리
    const rangeFields = ['views', 'likes'];
    for (const field of rangeFields) {

      const range = parsedFilter[field];
      if (range && typeof range === 'object') {
        const min = parseInt(range.min);
        const max = parseInt(range.max);

        if (field === 'views') {
          if (!isNaN(min)) conditions.push(`p.video_view_count >= ${min}`);
          if (!isNaN(max)) conditions.push(`p.video_view_count <= ${max}`);
        }
        else if (field === 'likes') {
          if (!isNaN(min)) conditions.push(`p.like_count >= ${min}`);
          if (!isNaN(max)) conditions.push(`p.like_count <= ${max}`);
        }
      }
    }

    // ✅ 3. query 통합 검색 (a: analyzed_video, p: post 가정)
    if (typeof parsedFilter.query === 'string' && parsedFilter.query.trim() !== '') {
      const keyword = parsedFilter.query.replace(/'/g, "''").trim();
      conditions.push(`(
        EXISTS (SELECT 1 FROM unnest(a.topic_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
        EXISTS (SELECT 1 FROM unnest(a.genre_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
        EXISTS (SELECT 1 FROM unnest(a.format_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
        a.title ILIKE '%${keyword}%' OR
        a.summary ILIKE '%${keyword}%' OR
        a.visual_hook_summary ILIKE '%${keyword}%' OR
        a.sound_hook_summary ILIKE '%${keyword}%' OR
        a.text_hook_summary ILIKE '%${keyword}%' OR
        p.caption ILIKE '%${keyword}%'
      )`);
    }

    // ✅ 4. 최종 WHERE 절 조립
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return whereClause;

  } catch (err) {
    logger.error('[makeFilterWhereClause ERROR] :: ' + err.stack);
    throw err;
  }
};


/**
 * JSON 데이터 안에서 platform_shortcode를 비교하여 is_marked 값 세팅
 * @param {Object[]} responsePayload - search_result + analyzed_result 구조의 JSON 배열
 * @param {string[]} platformShortcodes - DB에서 뽑아온 platform_shortcode 리스트
 * @returns {Object[]} - is_marked 값이 채워진 JSON 배열
 */
 exports.markMatchedShortcodes = (responsePayload, platformShortcodes) => {
  if (!Array.isArray(responsePayload)) return [];

  return responsePayload.map(item => {
    if (!item.search_result) return item;

    const { platform_shortcode } = item.search_result;

    if (platformShortcodes.includes(platform_shortcode)) {
      return {
        ...item,
        search_result: {
          ...item.search_result,
          is_marked: true
        }
      };
    }

    // 매칭 안 되면 false로 지정
    return {
      ...item,
      search_result: {
        ...item.search_result,
        is_marked: false
      }
    };
  });
};