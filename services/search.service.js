const logger = require("../utils/logger");
const searchRepo = require("../repositories/search.repository");
const SearchResultVO = require('../model/searchResultVO');
const AnalyzedResultVO = require('../model/analyzedResultVO');
const MergedSearchAndAnalyzedResultDTO = require('../model/MergedSearchAndAnalyzedResultDTO');


/**
 * 통합 검색 - 데이터베이스 조회 서비스
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON} ReelsArray : DB조회 결과 - 48개
 */
exports.integratedSearchReels = async (userInputWord) => {

    try{
        // 데이터 베이스 조회
        let reelsData;

        return reelsData
    }
    catch(err) {

    }
}

/**
 * 통합 검색 - 데이터 정리 및 파싱
 * @param {string} userInputWord : 사용자 입력 검색어
 * @returns {JSON Array} 
 */
exports.parseReelsData = async (reelsData) => {
    
    try{

    }
    catch(err) {

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
        conditions.push(`a.view_count >= ${value}`);
      } 
      else if (key === 'likes') {
        conditions.push(`a.like_count >= ${value}`);
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
          conditions.push(`a.${key} @> ARRAY[${formattedArray}]::text[]`);
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
    console.log("✅ searchRepo 타입:", typeof searchRepo); // object여야 정상
    console.log("✅ searchRepo 내용:", searchRepo);
    console.log("✅ searchRepo keys:", Object.keys(searchRepo));
    const rows = await searchRepo.getSearchResultRepo(filterWhere);

    const searchResultVOList = rows.map(row => new SearchResultVO({
      thumbnailUrl: row.thumbnail_url,
      likeCount: row.like_count,
      videoViewCount: row.video_view_count,
      profileImageUrl: row.profile_image_url,
      creatorUsername: row.creator_username
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
      platformIconUrl: row.platform_icon_url,
      title: row.title,
      profileImageUrl: row.profile_image_url,
      creatorUsername: row.creator_username,
      followers: row.followers,
      playCount: row.play_count,
      viewCount: row.view_count,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      caption: row.caption,
      audioInfo: row.audio_info,
      topicTag: row.topic_tag,
      genreTag: row.genre_tag,
      formatTag: row.format_tag,
      summary: row.summary,
      visualHookSummary: row.visual_hook_summary,
      soundHookSummary: row.sound_hook_summary,
      textHookSummary: row.text_hook_summary
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