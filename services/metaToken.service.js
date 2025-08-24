const axios = require('axios');
const NodeCache = require('node-cache');

// 단일 인스턴스용 메모리 캐시. PM2 클러스터/다중 서버면 Redis 권장.
const cache = new NodeCache();

const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

// App Access Token 발급 엔드포인트 (client_credentials)
const OAUTH_URL = 'https://graph.facebook.com/oauth/access_token';

async function fetchAppAccessToken() {
  if (!APP_ID || !APP_SECRET) {
    throw new Error('META_APP_ID / META_APP_SECRET 미설정');
  }

  const { data } = await axios.get(OAUTH_URL, {
    params: {
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: 'client_credentials',
    },
    timeout: 10_000,
  });

  // Facebook App Access Token은 만료가 없다고 표기되는 경우가 많지만
  // 방어적으로 24h TTL 캐싱. 운영에선 Debug Token으로 TTL 확인 가능.
  cache.set('meta:app_token', data.access_token, 60 * 60 * 24);
  return data.access_token;
}

exports.metaTokenService = {
  /**
   * 유효 토큰을 반환. 없거나 만료 시 재발급
   */
  async get() {
    let token = cache.get('meta:app_token');
    if (token) return token;
    return fetchAppAccessToken();
  },

  /**
   * 강제 갱신(관리/크론용)
   */
  async refresh() {
    return fetchAppAccessToken();
  },
};
