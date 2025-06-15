const db = require("../config/database"); // DB 연결 모듈 가정
const logger = require("../utils/logger");

exports.insertAnalyzeRequest = async ({ userIdx, videoId, platform, originalUrl }) => {
  const query = `
    INSERT INTO analyze_request (user_idx, video_id, platform, original_url, requested_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING idx;
  `;
  const result = await db.query(query, [userIdx, videoId, platform, originalUrl]);
  logger.info("analyze_request idx :: " + result.rows[0].idx);
  return result.rows[0].idx;
};


exports.insertReelsVideo = async (videoEntity) => {
  const sql = `
    INSERT INTO reels_videos (
      reels_id, upload_date, video_name, creator_description, video_length, resolution,
      music_info, view_count, play_count, like_count, comment_count, thumbnail_url,
      platform, owner_name, owner_img, owner_follow, content_details,
      topic_description, topic_list, genre_list, format_list,
      one_line_summary, summary, hook_tag, hook_overall_summary,
      visual_hook_summary, sound_hook_script, sound_hook_summary,
      text_hook_content, text_hook_summary, user_email, user_idx
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22,
      $23, $24, $25, $26,
      $27, $28, $29,
      $30, $31, $32, $33
    )
    ON CONFLICT (reels_id) DO NOTHING
    RETURNING idx;
  `;

  const values = [
    videoEntity.reels_id,
    videoEntity.upload_date,
    videoEntity.video_name,
    videoEntity.creator_description,
    videoEntity.video_length,
    videoEntity.resolution,
    videoEntity.music_info,
    videoEntity.view_count,
    videoEntity.play_count,
    videoEntity.like_count,
    videoEntity.comment_count,
    videoEntity.thumbnail_url,
    videoEntity.platform,
    videoEntity.owner_name,
    videoEntity.owner_img,
    videoEntity.owner_follow,
    videoEntity.content_details,
    videoEntity.topic_description,
    videoEntity.topic_list,
    videoEntity.genre_list,
    videoEntity.format_list,
    videoEntity.one_line_summary,
    videoEntity.summary,
    videoEntity.hook_tag,
    videoEntity.hook_overall_summary,
    videoEntity.visual_hook_summary,
    videoEntity.sound_hook_script,
    videoEntity.sound_hook_summary,
    videoEntity.text_hook_content,
    videoEntity.text_hook_summary,
    videoEntity.user_email,
    videoEntity.user_idx,
  ];

  const result = await db.oneOrNone(sql, values);
  return result?.idx || null;
};


exports.insertTimelineBatch = async (timelineEntities) => {
  const sql = `
    INSERT INTO reels_timeline (
      reels_id, scene_start, scene_end, scene_description, dialogue
    ) VALUES 
    ${timelineEntities.map((_, idx) => `($${idx * 5 + 1}, $${idx * 5 + 2}, $${idx * 5 + 3}, $${idx * 5 + 4}, $${idx * 5 + 5})`).join(", ")}
  `;

  const values = timelineEntities.flatMap(entity => [
    entity.reels_id,
    entity.scene_start,
    entity.scene_end,
    entity.scene_description,
    entity.dialogue
  ]);

  return await db.none(sql, values);
};
