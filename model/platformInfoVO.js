class PlatformInfoVO {
    constructor({
        platform,
        rawUrl,
        canonicalUrl,
        ids,
        meta
    }) {
      this.platform     = platform
      this.rawUrl       = rawUrl;
      this.canonicalUrl = canonicalUrl;
      this.ids          = ids;
      this.meta         = meta;
    }
  }
  
  module.exports = PlatformInfoVO;
  