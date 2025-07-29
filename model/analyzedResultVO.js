class AnalyzedResultVO {
    constructor({
      platform_icon_url,
      title,
      profile_image_url,
      creator_username,
      followers,
      play_count,
      view_count,
      like_count,
      comment_count,
      caption,
      audio_info,
      topic_tag,
      genre_tag,
      format_tag,
      summary,
      visual_hook_summary,
      sound_hook_summary,
      text_hook_summary
    }) {
      this.platform_icon_url    = platform_icon_url;
      this.title                = title;
      this.profile_image_url    = profile_image_url;
      this.creator_username     = creator_username;
      this.followers            = followers;
      this.play_count           = play_count;
      this.view_count           = view_count;
      this.like_count           = like_count;
      this.comment_count        = comment_count;
      this.caption              = caption;
      this.audio_info           = audio_info;
      this.topic_tag            = topic_tag;
      this.genre_tag            = genre_tag;
      this.format_tag           = format_tag;
      this.summary              = summary;
      this.visual_hook_summary  = visual_hook_summary;
      this.sound_hook_summary   = sound_hook_summary;
      this.text_hook_summary    = text_hook_summary;
    }
  }
  
  module.exports = AnalyzedResultVO;
  