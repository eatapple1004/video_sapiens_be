const redis = require("redis");
const logger = require("../utils/logger");

//const client = redis.createClient();

const client = redis.createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379,
  },
  database: 0  // ✅ DB 번호 설정
});

client.connect()
  .then(() => logger.info("✅ Redis 연결 성공"))
  .catch(err => logger.error("❌ Redis 연결 실패: " + err.message));

module.exports = client;
