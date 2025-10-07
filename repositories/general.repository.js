const db     = require("../config/database");
const logger = require("../utils/logger");

/**
 * Creator 테이블에서 ig_id로 idx 조회
 * @param {string} ig_id - Instagram 고유 ID
 * @returns {number|null} 해당 크리에이터의 idx (없으면 null)
 */
exports.selectCreatorByID = async (ig_id) => {
    try {
        const query = `SELECT idx FROM creator WHERE ig_id = $1`;
        const result = await db.query(query, [ig_id]);
    
        if (result.rows.length > 0) {
            return result.rows[0].idx;
        } else {
            return false; // 존재하지 않음
        }
    } catch (err) {
        logger.error('[selectCreatorByID ERROR] ::', err.stack);
        throw err; // 호출한 측에서 처리할 수 있도록 throw
    }
};

/**
 * Instagram ig_id 기준으로 Creator row 존재 여부 확인
 * @param {string} ig_id 
 * @returns {boolean} true: 존재함 / false: 존재하지 않음
 */
 exports.checkExistCreatorByID = async (ig_id) => {
    try {
        const query = `
            SELECT EXISTS (
                SELECT 1 FROM creator WHERE ig_id = $1
            )
        `;
        const result = await db.query(query, [ig_id]);

        return result.rows[0].exists;  // true or false
    } catch (err) {
        logger.error('[checkExistCreatorByID ERROR] ::', err.stack);
        throw err; // 상위 로직에서 에러 핸들링하도록 전달
    }
};

/**
 * CreatorTableEntity 객체를 DB에 INSERT
 * @param {CreatorTableEntity} creatorTableEntity 
 * @returns {number} 새로 삽입된 row의 idx (Primary Key)
 */
 exports.insertCreatorTable = async (creatorTableEntity) => {
    try {
        const query = `
            INSERT INTO creator (
                platform,
                biography,
                followers,
                followings,
                full_name,
                ig_id,
                category_name,
                username,
                profile_pic_url,
                relate_profile,
                created_at,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12
            )
            RETURNING idx;
        `;

        const values = [
            creatorTableEntity.platform,
            creatorTableEntity.biography,
            creatorTableEntity.followers,
            creatorTableEntity.followings,
            creatorTableEntity.full_name,
            creatorTableEntity.ig_id,
            creatorTableEntity.category_name,
            creatorTableEntity.username,
            creatorTableEntity.profile_pic_url,
            creatorTableEntity.relate_profile,
            creatorTableEntity.created_at,
            creatorTableEntity.updated_at
        ];
        await db.query("SET TIME ZONE 'Asia/Seoul'");
        const result = await db.query(query, values);
        return result.rows[0].idx;

    } catch (err) {
        logger.error('[insertCreatorTable ERROR] ::', err.stack);
        throw err;
    }
};


exports.selectPostIdxByShortcode = async (shortcode) => {
    try{
        const query = `SELECT idx FROM post WHERE shortcode = $1`;
        const result = await db.query(query, [shortcode]);
        
        if (result.rows.length > 0) {
            return result.rows[0].idx;
        } else {
            return false; // 존재하지 않음
        }
    }
    catch(err) {

    }
}

exports.insertPostTable = async (postTableEntity) => {
    try{
        const query = `
            INSERT INTO post (
                creator_idx,
                owner_id,
                owner_username,
                typename,
                post_id,
                shortcode,
                width,
                height,
                is_video,
                has_audio,
                video_view_count,
                caption,
                comment_count,
                like_count,
                preview_like_count,
                taken_at,
                song_name,
                artist_name,
                audio_id,
                is_original_song,
                created_at,
                updated_at,
                video_url,
                thumbnail_url,
                viral_score
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, NOW(), NOW(),
                $23, $24
            )
            RETURNING idx;
        `;
        const values = [
            postTableEntity.idx,
            postTableEntity.creator_idx,
            postTableEntity.owner_id,
            postTableEntity.owner_username,
            postTableEntity.typename,
            
            postTableEntity.post_id,
            postTableEntity.shortcode,
            postTableEntity.width,
            postTableEntity.height,
            postTableEntity.is_video,
            
            postTableEntity.has_audio,
            postTableEntity.video_view_count,
            postTableEntity.caption,
            postTableEntity.comment_count,
            postTableEntity.like_count,
            
            postTableEntity.preview_like_count,
            postTableEntity.taken_at,
            postTableEntity.song_name,
            postTableEntity.artist_name,
            postTableEntity.audio_id,
            
            postTableEntity.is_original_song,
            postTableEntity.video_url,
            postTableEntity.thumbnail_url,
            postTableEntity.viral_score
        ];

        await db.query("SET TIME ZONE 'Asia/Seoul'");
        const result = await pool.query(query, values);
        return result.rows[0].idx;
        
    }
    catch(err) {
        
    }
}

exports.updatePostTable = async (creatorInfo) => {
    try{

    }
    catch(err) {
        
    }
}


/**
 * 주어진 idx 리스트에 해당하는 영상들의 platform과 video_code를 조회
 * @param {number[]} idxList - analyzed_video.idx 리스트
 * @returns {Promise<{ platform: string, video_code: string }[]>}
 */
 exports.findPlatformAndCodeByIdxList = async (idxList) => {
    //console.log(idxList)
    if (!idxList || idxList.length === 0) {
        return [];
    }
    
    console.log(idxList)

    const query = `
        SELECT platform, video_code
        FROM analyzed_video
        WHERE idx = ANY($1)
    `;
  
    const values = [idxList];
    const { rows } = await db.query(query, values);
    return rows;
  };