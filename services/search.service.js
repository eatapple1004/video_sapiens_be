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
        // 🔹 조회수 10,000,000 이상일 때는 상한 조건 없이 최소값만
        if (Number(value) >= 10000000) {
          conditions.push(`p.video_view_count >= ${value}`);
        } else {
          conditions.push(`p.video_view_count BETWEEN ${value} AND 10000000`);
        }
      } 
      else if (key === 'likes') {
        // 🔹 좋아요 10,000,000 이상일 때는 상한 조건 없이 최소값만
        if (Number(value) >= 10000000) {
          conditions.push(`p.like_count >= ${value}`);
        } else {
          conditions.push(`p.like_count BETWEEN ${value} AND 10000000`);
        }
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
        //parsedFilterData.query = value.trim();
        parsedFilterData.query = parseQueryString(value.trim());

      } else if (key === 'lastShortCode') {
        const raw = String(value).trim();
        if (raw) {
          // "{platform}_{shortcode}" 형태면 '_' 뒤만 사용, 없으면 전체 사용
          const us = raw.indexOf('_');
          const shortcode = (us > -1 ? raw.slice(us + 1) : raw).trim();

          if (shortcode) {
            parsedFilterData.cursor = { shortcode };
            //console.log(parsedFilterData.cursor);  // { shortcode: 'rrDZGzFRa8o' }
          }
        }
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
 * 사용자 검색어 문자열 파싱
 * - 공백 → 기본 OR
 * - -단어 → NOT 검색
 * - "구문" → 정확 구문 검색
 * @param {string} rawQuery 
 * @returns {{ include: string[], exclude: string[] }}
 */
function parseQueryString(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { include: [], exclude: [] };
  }

  const phrases = [];
  const phraseRegex = /"([^"]+)"/g;
  let m;
  let cleaned = rawQuery;

  // 큰따옴표 처리
  while ((m = phraseRegex.exec(rawQuery)) !== null) {
    phrases.push(m[1].trim());
  }
  cleaned = cleaned.replace(phraseRegex, ' ');

  // 토큰 분리
  const tokens = cleaned
    .split(/\s+/)
    .map(v => v.trim())
    .filter(Boolean);

  const include = [];
  const exclude = [];

  tokens.forEach(tok => {
    if (tok.startsWith('-') && tok.length > 1) {
      exclude.push(tok.substring(1));   // -단어 → 제외
    } else if (tok.toUpperCase() !== 'OR') {
      include.push(tok);                // 일반 단어 → 포함
    }
  });

  // 최종 반환
  return {
    include: [...include, ...phrases],
    exclude
  };
}


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

    // ✅ 1. 배열 필드 유효성 검사 및 WHERE 절 생성
    const arrayFields = ['platform', 'topic', 'genre', 'format'];

    for (const field of arrayFields) {
      const value = parsedFilter[field];

      if (field === 'platform') {
        // 항상 포함되는 필드
        if (Array.isArray(value) && value.length > 0) {
          const platformConditions = value.map(v => `a.platform = '${v}'`);
          conditions.push(`(${platformConditions.join(' OR ')})`);
        } else if (typeof value === 'string' && value.trim() !== '') {
          conditions.push(`a.platform = '${value.trim()}'`);
        } else {
          conditions.push(`a.platform = '__NO_PLATFORM__'`);
        }
      } 
      else if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string')) {
        const lowerValues = value.map(v => v.toLowerCase());
  
        // 각 태그마다 EXISTS 절 생성 (모두 만족해야 함 = AND)
        const tagConditions = lowerValues.map(val => `
          EXISTS (
            SELECT 1 FROM unnest(a.${field}_tag) AS tag
            WHERE LOWER(tag) = '${val}'
          )
        `);

        // 모든 태그 조건을 AND로 연결
        conditions.push(`(${tagConditions.join(' AND ')})`);
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
          if (!isNaN(max) && Number(max) < 10000000) conditions.push(`p.video_view_count <= ${max}`);
        } else if (field === 'likes') {
          if (!isNaN(min)) conditions.push(`p.like_count >= ${min}`);
          if (!isNaN(max) && Number(max) < 10000000) conditions.push(`p.like_count <= ${max}`);
        }
      }
    }

    // ✅ 3. query 통합 검색 (include OR, exclude NOT)
    if (parsedFilter.query && typeof parsedFilter.query === 'object') {
      const { include = [], exclude = [] } = parsedFilter.query;

      // 🔎 포함 검색 (OR)
      if (include.length > 0) {
        const includeConds = include.map(kwRaw => {
          const keyword = kwRaw.replace(/'/g, "''").trim();
          return `(
            EXISTS (SELECT 1 FROM unnest(a.topic_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
            EXISTS (SELECT 1 FROM unnest(a.genre_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
            EXISTS (SELECT 1 FROM unnest(a.format_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
            a.title ILIKE '%${keyword}%' OR
            a.summary ILIKE '%${keyword}%' OR
            a.visual_hook_summary ILIKE '%${keyword}%' OR
            a.sound_hook_summary ILIKE '%${keyword}%' OR
            a.text_hook_summary ILIKE '%${keyword}%' OR
            p.caption ILIKE '%${keyword}%'
          )`;
        });
        conditions.push(`(${includeConds.join(' OR ')})`);
      }

      // 🔎 제외 검색 (NOT)
      if (exclude.length > 0) {
        const excludeConds = exclude.map(kwRaw => {
          const keyword = kwRaw.replace(/'/g, "''").trim();
          return `NOT (
            EXISTS (SELECT 1 FROM unnest(a.topic_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
            EXISTS (SELECT 1 FROM unnest(a.genre_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
            EXISTS (SELECT 1 FROM unnest(a.format_tag) AS tag WHERE tag ILIKE '%${keyword}%') OR
            a.title ILIKE '%${keyword}%' OR
            a.summary ILIKE '%${keyword}%' OR
            a.visual_hook_summary ILIKE '%${keyword}%' OR
            a.sound_hook_summary ILIKE '%${keyword}%' OR
            a.text_hook_summary ILIKE '%${keyword}%' OR
            p.caption ILIKE '%${keyword}%'
          )`;
        });
        conditions.push(`(${excludeConds.join(' AND ')})`);
      }
    }

    // ✅ 4) 커서 기반(next page): lastShortCode만 사용
    // 정렬: ORDER BY p.like_count DESC, p.shortcode DESC  (필수!)
    // ✅ 커서 기반(next page): lastShortCode만 사용, like_count 기준으로 엄격히 작은 것만
    if (parsedFilter.cursor?.shortcode) {
      const sc = parsedFilter.cursor.shortcode.trim();
      if (sc) {
        const scLit = escapeLiteral(sc);

        // 해당 숏츠코드의 like_count 조회
        const curLike = `(SELECT p2.like_count FROM post p2 WHERE p2.shortcode = ${scLit} LIMIT 1)`;

        // 커서가 유효하지 않더라도 목록이 비지 않도록: NULL이면 조건 무시
        // (curLike가 NULL → TRUE, 아니면 p.like_count < curLike)
        conditions.push(`( (${curLike}) IS NULL OR p.like_count < (${curLike}) )`);
      }
    }

    // ✅ 5. 최종 WHERE 절 조립
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




/** Jaro/Winkler 구현 */
function jaro(s, t) {
  if (s === t) return 1;
  const sl = s?.length || 0, tl = t?.length || 0;
  if (!sl || !tl) return 0;
  const matchDist = Math.floor(Math.max(sl, tl) / 2) - 1;
  const sMatch = Array(sl).fill(false), tMatch = Array(tl).fill(false);
  let matches = 0, transpositions = 0;

  for (let i = 0; i < sl; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, tl);
    for (let j = start; j < end; j++) {
      if (tMatch[j] || s[i] !== t[j]) continue;
      sMatch[i] = tMatch[j] = true; matches++; break;
    }
  }
  if (!matches) return 0;

  for (let i = 0, k = 0; i < sl; i++) {
    if (!sMatch[i]) continue;
    while (!tMatch[k]) k++;
    if (s[i] !== t[k]) transpositions++;
    k++;
  }
  transpositions /= 2;
  return (matches/sl + matches/tl + (matches - transpositions)/matches) / 3;
}
function jaroWinkler(s, t, p = 0.1, maxPrefix = 4) {
  s = (s || '').toLowerCase();
  t = (t || '').toLowerCase();
  const j = jaro(s, t);
  let l = 0;
  while (l < Math.min(maxPrefix, s.length, t.length) && s[l] === t[l]) l++;
  return j + l * p * (1 - j);
}

function rerankByJW(cands, token) {
  return cands
    .map(c => {
      const jw = jaroWinkler(c.word, token);
      const score = 0.7 * (c.trigram_sim || 0) + 0.3 * jw; // 가중치 튜닝 가능
      return { ...c, jw, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * include 토큰들에 대해 후보 제안 + 자동보정
 * @param {string[]} includeTokens
 * @param {{autoThreshold?: number, limitPerToken?: number}} opts
 */
exports.suggestAndMaybeAutocorrect = async (includeTokens, opts = {}) => {
  const { autoThreshold = 0.90, limitPerToken = 8 } = opts;

  // 1) 후보 일괄 조회 (trgm)
  const candMap = await searchRepo.findSimilarCandidatesBatch(includeTokens, limitPerToken);

  // 2) 재랭킹 + 결과 구성
  const suggestions = {};
  const corrected = [];
  let anyChanged = false;

  for (const tok of includeTokens) {
    const list = candMap[tok] || [];
    if (tok.length < 2 || list.length === 0) {
      corrected.push(tok);
      continue;
    }
    const ranked = rerankByJW(list, tok);

    // 추천 후보 상위 3개만
    suggestions[tok] = ranked.slice(0, 3).map(r => ({ word: r.word, jw: r.jw, trigram: r.trigram_sim }));

    // 자동 보정 판단
    const top = ranked[0];
    if (top.jw >= autoThreshold) {
      corrected.push(top.word);
      if (top.word !== tok) anyChanged = true;
    } else {
      corrected.push(tok);
    }
  }

  return { suggestions, corrected: anyChanged ? corrected : null };
};



/**
 * 분석 결과(responsePayload 배열)에서 태그 리스트(topic/genre/format)를 추출하는 함수
 * 
 * @param {Array} responsePayload - mergeSearchAndAnalyzedResult()의 반환 배열
 * @returns {{ topic_list: string[], genre_list: string[], format_list: string[] }}
 */
 exports.extractTagListFromResponse = (responsePayload) => {
  try {
    if (!Array.isArray(responsePayload)) {
      console.warn("[extractTagListFromResponse] responsePayload is not an array");
      return { topic_list: [], genre_list: [], format_list: [] };
    }

    const topicSet = new Set();
    const genreSet = new Set();
    const formatSet = new Set();

    for (const item of responsePayload) {
      const analyzed = item?.analyzed_result;
      if (!analyzed) continue;

      // topic_tag
      if (Array.isArray(analyzed.topic_tag)) {
        analyzed.topic_tag.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim() !== '') {
            topicSet.add(tag.trim());
          }
        });
      }

      // genre_tag
      if (Array.isArray(analyzed.genre_tag)) {
        analyzed.genre_tag.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim() !== '') {
            genreSet.add(tag.trim());
          }
        });
      }

      // format_tag
      if (Array.isArray(analyzed.format_tag)) {
        analyzed.format_tag.forEach(tag => {
          if (tag && typeof tag === 'string' && tag.trim() !== '') {
            formatSet.add(tag.trim());
          }
        });
      }
    }

    return {
      topic_list: [...topicSet].sort(),
      genre_list: [...genreSet].sort(),
      format_list: [...formatSet].sort()
    };

  } catch (err) {
    logger.error("[extractTagListFromResponse ERROR] :: " + err.stack);
    throw err;
  }
};

/**
 * 🔍 추천 및 오타 교정 처리 로직
 * 
 * @param {Object} parsedData - 파싱된 검색 데이터 (query.include 포함)
 * @returns {Promise<{ suggestions: any, autocorrectedTo: string[] | null, parsedData: Object }>}
 * 
 * includeTokens(검색어 토큰)들을 기반으로 후보 제안 및 자동 교정 수행.
 */
 exports.handleAutoCorrection = async (parsedData) => {
  try {
    let suggestions = null;
    let autocorrectedTo = null;

    // include 배열 추출
    const includeTokens = parsedData?.query?.include || [];

    if (includeTokens.length > 0) {
      const { suggestions: sug, corrected } =
        await exports.suggestAndMaybeAutocorrect(includeTokens, {
          autoThreshold: 0.80,   // 도메인에 맞게 튜닝
          limitPerToken: 8
        });

      suggestions = sug;
      if (corrected) {
        // 교정된 결과를 parsedData에 반영
        parsedData.query.include = corrected;
        autocorrectedTo = corrected;
      }
    }

    return { suggestions, autocorrectedTo, parsedData };

  } catch (err) {
    logger.error(`[handleAutoCorrection ERROR] :: ${err.stack}`);
    throw err;
  }
};