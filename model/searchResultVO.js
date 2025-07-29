class SearchResultVO {
    constructor({
      thumbnail_url,
      like_count,
      video_view_count,
      profile_image_url,
      creator_username
    }) {
      this.thumbnail_url = thumbnail_url;
      this.like_count = like_count;
      this.video_view_count = video_view_count;
      this.profile_image_url = profile_image_url;
      this.creator_username = creator_username;
    }
  }
  
  module.exports = SearchResultVO;
  