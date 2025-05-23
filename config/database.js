require('../Def')
const logger = require("../utils/logger");

const { Pool } = require("pg");

const pool = new Pool({
    host:     DB_HOST,
    port:     DB_PORT,
    database: DB_NAME,
    user:     DB_USER,
    password: DB_PASSWORD
});

pool.connect()
  .then(() => logger.info("✅ PostgreSQL 연결 성공"))
  .catch(err => logger.error("❌ PostgreSQL 연결 실패", err));

module.exports = pool;
