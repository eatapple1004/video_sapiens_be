const logger = require("../utils/logger");

const gerneralRepo = require("../repositories/general.repository");

/**
 * 
 * @param {*} creator_id 
 * 
 * youtube   : channel_id
 * instagram : ig_id
 * tiktok    : ?
 */
exports.selectCreatorByID= async (creator_id) => {

    try {
        if (!creator_id || typeof creator_id !== 'string') {
            throw new Error('Invalid creator_id: must be a non-empty string');
        }
    
        const creatorIdx = await gerneralRepo.selectCreatorByID(creator_id);
        return creatorIdx; // number or false
    } catch (err) {
        logger.error('[Service: detectCreatorByID] :: ' + err.stack);
        throw err;
    }

}

