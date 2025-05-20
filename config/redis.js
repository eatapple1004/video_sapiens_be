const redis = require("redis");
const logger = require("../utils/logger");

const client = redis.createClient();

client.connect()
  .then(() => logger.info("✅ Redis 연결 성공"))
  .catch(err => logger.error("❌ Redis 연결 실패: " + err.message));

module.exports = client;
