const cron = require('node-cron');
const { updateViralRanking } = require('../services/trending.service');

// 🕒 30분마다 실행
cron.schedule('*/30 * * * *', async () => {
  console.log(`[🔁] Redis viral score 갱신 스케줄러 실행 - ${new Date().toISOString()}`);
  await updateViralRanking();
});
