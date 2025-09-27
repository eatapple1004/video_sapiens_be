class AutoInsertResDTO {
    constructor({
        platform,
        short_code,
        views,
        likes,
        comments,
        creator,
        video_title,
        video_description,
        upload_date,
        thumbnail_url
    }) {
      this.platform          = platform;
      this.short_code        = short_code;
      this.views             = views;
      this.likes             = likes;
      this.comments          = comments;
      this.creator           = creator;
      this.video_title       = video_title;
      this.video_description = video_description;
      this.upload_date       = upload_date;
      this.thumbnail_url     = thumbnail_url
    }
  }
  
  module.exports = AutoInsertResDTO;
  