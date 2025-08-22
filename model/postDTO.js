class PostDTO {
    constructor({
        idx,
        shortcode,
        thumbnail_url,
        like_count,
        video_view_count,
        comment_count,
        owner_username
    }) {
        this.idx               = idx;
        this.shortcode         = shortcode;           // 플랫폼 고유 식별자
        this.thumbnail_url     = thumbnail_url;
        this.like_count        = like_count;
        this.video_view_count  = video_view_count;
        this.comment_count     = comment_count;
        this.owner_username    = owner_username;
        
    }
}
  
module.exports = PostDTO;

  