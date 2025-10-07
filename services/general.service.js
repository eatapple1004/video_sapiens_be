const logger = require("../utils/logger");

const generalRepo = require("../repositories/general.repository");
const e = require("express");


/**
 * 
 * @param {*} creator_id 
 * 
 * youtube   : channel_id
 * instagram : ig_id
 * tiktok    : ?
 */
exports.selectCreatorByID = async (creator_id) => {

    try {
        if (!creator_id || typeof creator_id !== 'string') {
            throw new Error('Invalid creator_id: must be a non-empty string');
        }
    
        const creatorIdx = await generalRepo.selectCreatorByID(creator_id);
        return creatorIdx; // number or false
    } catch (err) {
        logger.error('[Service: detectCreatorByID] :: ' + err.stack);
        throw err;
    }

}

exports.checkExistCreatorByID = async (creator_id) => {

    try {
        if (!creator_id || typeof creator_id !== 'string') {
            throw new Error('Invalid creator_id: must be a non-empty string');
        }
    
        const result = await generalRepo.checkExistCreatorByID(creator_id);
        return result; // number or false
    } catch (err) {
        logger.error('[Service: detectCreatorByID] :: ' + err.stack);
        throw err;
    }

}

exports.insertCreatorTable = async (creatorTableEntity) => {
    try{
        if (!creatorTableEntity) {
            throw new Error('Invalid creator_id: must be a non-empty creatorTableEntity');
        }
    
        const result = await generalRepo.insertCreatorTable(creatorTableEntity);
        console.log(result);
;        return result; // number or false
    }
    catch{
        logger.error('[insertCreatorTable] :: ' + err.stack);
        throw err;
    }
}

exports.updateCreatorTable = async (creatorInfo) => {
    try{

    }
    catch(err) {
        
    }
}


exports.selectPostIdxByShortcode = async (shortcode) => {
    try{
        if (!shortcode) {
            throw new Error('Invalid creator_id: must be a non-empty creatorTableEntity');
        }

        const result = await generalRepo.selectPostIdxByShortcode(shortcode);
        return result;
    }
    catch(err) {
        logger.error('[General Service: selectPostIdxByShortcode] :: ' + err.stack);
        throw err;
    }
}

exports.insertPostTable = async (postTableEntity) => {
    try{
        if (!postTableEntity) {
            throw new Error('Invalid creator_id: must be a non-empty creatorTableEntity');
        }
    
        const result = await generalRepo.insertPostTable(postTableEntity);
        return result; // number or false
    }
    catch(err) {
        
    }
}

exports.updatePostTable = async (postTableEntity) => {
    try{

    }
    catch(err) {
        
    }
}


/**
 * Get Mark_List (Analyzed_Video_idx) by UserEmail
 * @param {Object} userEmail - parseUserInputFilter 결과 객체
 * @returns {List} mark_list 
 */
exports.getMarkListByUserEmail = async (userEmail) => {
    try {

    }
    catch (err) {

    }
}



/**
 * idx 리스트를 받아 platform_shortcode 리스트 반환
 * @param {number[]} markList - analyzed_video.idx 리스트
 * @returns {Promise<string[]>} - platform_shortcode 리스트
 */
 exports.getPlatformShortcodes = async (markList) => {
    console.log(markList)
    const results = await generalRepo.findPlatformAndCodeByIdxList(markList);
  
    // platform_shortcode = "{platform}_{video_code}"
    const platform_shortcodes = results.map(r => `${r.platform}_${r.video_code}`);
  
    return platform_shortcodes;
};