class TimelineEntity {
    constructor({ video_idx, scene_start, scene_end, scene_description, dialogue }) {
      this.video_idx = video_idx;                     // 기존 reels_id → video_idx로 수정
      this.scene_start = scene_start;
      this.scene_end = scene_end;
      this.scene_description = scene_description;
      this.dialogue = dialogue;
    }
  }
  
  module.exports = TimelineEntity;
  