const redis = require('../config/redis');
const trendingRepo = require('../repositories/trending.repository');
const TrendingPostVO = require("../model/postDTO");

exports.updateViralRanking = async () => {
  try {
    const topPosts = await trendingRepo.getTop300PostIdxs();

    // 기존 리스트 삭제
    await redis.del('viral_post_top300');

    // idx만 저장 (List: LPUSH → 순서를 유지하기 위해 reverse)
    const idxList = topPosts.map(post => String(post.idx));

    if (idxList.length > 0) {
      await redis.rPush('viral_post_top300', idxList);  // ✅ 정방향 저장
    }

    console.log(`[✅] Redis viral_post_top300 갱신 완료 - ${idxList.length}개`);
  } catch (err) {
    console.error('[❌] Redis 갱신 실패:', err.message);
  }
};


exports.getPostListData = async (topIdx) => {

    const posts = await trendingRepo.getPostsByIdxList(topIdx);

    return posts.map(post => new TrendingPostVO({
        idx: post.idx,
        shortcode:        post.shortcode,
        thumbnail_url:    post.thumbnail_url,
        like_count:       post.like_count,
        video_view_count: post.video_view_count,
        comment_count:    post.comment_count,
        owner_username:   post.owner_username,
    }));

};