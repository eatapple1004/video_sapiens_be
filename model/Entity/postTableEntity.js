class PostTableEntity {
    constructor({
      idx = null,
      creator_idx,
      owner_id,
      owner_username,
      typename,
      post_id,
      shortcode,
      width = null,
      height = null,
      is_video = null,
      has_audio = null,
      video_view_count = null,
      caption = null,
      comment_count = null,
      like_count = null,
      preview_like_count = null,
      taken_at = null,
      song_name = null,
      artist_name = null,
      audio_id = null,
      is_original_song = null,
      created_at = new Date(),
      updated_at = new Date(),
      video_url = null,
      thumbnail_url = null,
      viral_score = 0
    }) {
      this.idx = idx;
      this.creator_idx = creator_idx;
      this.owner_id = owner_id;
      this.owner_username = owner_username;
      this.typename = typename;
      this.post_id = post_id;
      this.shortcode = shortcode;
      this.width = width;
      this.height = height;
      this.is_video = is_video;
      this.has_audio = has_audio;
      this.video_view_count = video_view_count;
      this.caption = caption;
      this.comment_count = comment_count;
      this.like_count = like_count;
      this.preview_like_count = preview_like_count;
      this.taken_at = taken_at;
      this.song_name = song_name;
      this.artist_name = artist_name;
      this.audio_id = audio_id;
      this.is_original_song = is_original_song;
      this.created_at = created_at;
      this.updated_at = updated_at;
      this.video_url = video_url;
      this.thumbnail_url = thumbnail_url;
      this.viral_score = viral_score;
    }
  }
  
  module.exports = PostTableEntity;
  