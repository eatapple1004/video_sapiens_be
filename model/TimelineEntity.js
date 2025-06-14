class TimelineEntity {
    constructor({ reels_id, scene_start, scene_end, scene_description, dialogue }) {
        this.reels_id = reels_id;
        this.scene_start = scene_start;
        this.scene_end = scene_end;
        this.scene_description = scene_description;
        this.dialogue = dialogue;
    }
}

module.exports = TimelineEntity;
  