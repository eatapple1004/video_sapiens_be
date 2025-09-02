class AutoInsertResDTO {
    constructor({
        platform,
		views,
		likes,
		comments,
		creator,
		video_title,
		video_description,
        upload_date,
    }) {
      this.platform          = platform
      this.views             = views;
      this.likes             = likes;
      this.comments          = comments;
      this.creator           = creator;
      this.video_title       = video_title;
      this.video_description = video_description;
      this.upload_date       = upload_date;
    }
  }
  
  module.exports = AutoInsertResDTO;
  