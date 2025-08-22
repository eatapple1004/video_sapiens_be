const redis = require('../utils/redisClient');
const { getTop300Posts } = require('../repositories/trending.repository');

exports.updateViralRanking = async () => {
    try {
        const topPosts = await getTop300Posts();
  
        // 기존 랭킹 삭제
        await redis.del('viral_post_top300');
  
        // ZSET 삽입: [score1, member1, score2, member2, ...]
        const zsetData = topPosts.flatMap(post => [post.viral_score, post.idx]);
        await redis.zadd('viral_post_top300', ...zsetData);
  
        console.log(`[✅] Redis viral_post_top300 갱신 완료 - ${topPosts.length}개`);
    } catch (err) {
        console.error('[❌] Redis 갱신 실패:', err.message);
    }
};