class SearchResultVO {
    constructor({
      thumbnailUrl,
      likeCount,
      videoViewCount,
      profileImageUrl,
      creatorUsername
    }) {
      this.thumbnailUrl = thumbnailUrl;
      this.likeCount = likeCount;
      this.videoViewCount = videoViewCount;
      this.profileImageUrl = profileImageUrl;
      this.creatorUsername = creatorUsername;
    }
  }
  
  module.exports = SearchResultVO;
  