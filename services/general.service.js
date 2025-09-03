const logger = require("../utils/logger");

const generalRepo = require("../repositories/general.repository");


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
        return result; // number or false
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
        logger.error('[Service: selectPostIdxByShortcode] :: ' + err.stack);
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