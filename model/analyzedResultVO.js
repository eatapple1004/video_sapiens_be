class AnalyzedResultVO {
    constructor({
      platformIconUrl,
      title,
      profileImageUrl,
      creatorUsername,
      followers,
      playCount,
      viewCount,
      likeCount,
      commentCount,
      caption,
      audioInfo,
      topicTag,
      genreTag,
      formatTag,
      summary,
      visualHookSummary,
      soundHookSummary,
      textHookSummary
    }) {
      this.platformIconUrl = platformIconUrl;
      this.title = title;
      this.profileImageUrl = profileImageUrl;
      this.creatorUsername = creatorUsername;
      this.followers = followers;
      this.playCount = playCount;
      this.viewCount = viewCount;
      this.likeCount = likeCount;
      this.commentCount = commentCount;
      this.caption = caption;
      this.audioInfo = audioInfo;
      this.topicTag = topicTag;
      this.genreTag = genreTag;
      this.formatTag = formatTag;
      this.summary = summary;
      this.visualHookSummary = visualHookSummary;
      this.soundHookSummary = soundHookSummary;
      this.textHookSummary = textHookSummary;
    }
  }
  
  module.exports = AnalyzedResultVO;
  