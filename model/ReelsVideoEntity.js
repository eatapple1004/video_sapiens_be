class ReelsVideoEntity {
    constructor({
        idx,
        reels_id,
        upload_date,
        video_name,
        creator_description,
        video_length,
        resolution,
        music_info,
        view_count,
        play_count,
        like_count,
        comment_count,
        thumbnail_url,
        platform,
        owner_name,
        owner_img,
        owner_follow,
        content_details,
        topic_description,
        topic_list,
        genre_list,
        format_list,
        one_line_summary,
        summary,
        hook_tag,
        hook_overall_summary,
        visual_hook_summary,
        sound_hook_script,
        sound_hook_summary,
        text_hook_content,
        text_hook_summary,
        user_email,
        user_idx
    }) {
        this.idx = idx;
        this.reels_id = reels_id;
        this.upload_date = upload_date;
        this.video_name = video_name;
        this.creator_description = creator_description;
        this.video_length = video_length;
        this.resolution = resolution;
        this.music_info = music_info;
        this.view_count = view_count;
        this.play_count = play_count;
        this.like_count = like_count;
        this.comment_count = comment_count;
        this.thumbnail_url = thumbnail_url;
        this.platform = platform;
        this.owner_name = owner_name;
        this.owner_img = owner_img;
        this.owner_follow = owner_follow;
        this.content_details = content_details;
        this.topic_description = topic_description;
        this.topic_list = topic_list;
        this.genre_list = genre_list;
        this.format_list = format_list;
        this.one_line_summary = one_line_summary;
        this.summary = summary;
        this.hook_tag = hook_tag;
        this.hook_overall_summary = hook_overall_summary;
        this.visual_hook_summary = visual_hook_summary;
        this.sound_hook_script = sound_hook_script;
        this.sound_hook_summary = sound_hook_summary;
        this.text_hook_content = text_hook_content;
        this.text_hook_summary = text_hook_summary;
        this.user_email = user_email;
        this.user_idx = user_idx;
    }
  }
  
  module.exports = ReelsVideoEntity;
  