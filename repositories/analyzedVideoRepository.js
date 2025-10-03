// repository/analyzedVideoRepository.js
const fs = require("fs");
const path = require("path");
const db     = require("../config/database");

// JSON 파일 경로 (같은 폴더)
const filePath = path.join(__dirname, "results.json");

// analyzed_video 테이블에 단일 레코드 삽입
async function insertAnalyzedVideo(video) {

  const { shortcode, analysis } = video;

  const query = `
    INSERT INTO analyzed_video
    (platform, video_code, title, topic_tag, genre_tag, format_tag,
     summary, one_line_summary, hook_summary,
     visual_hook_summary, sound_hook_summary, text_hook_summary,
     created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now())
    RETURNING idx
  `;

  const values = [
    "youtube",
    shortcode,
    analysis?.Title || null,
    analysis?.Tags?.["Topic Tag"]?.split(",").map(t => t.trim()) || [],
    analysis?.Tags?.["Genre Tag"]?.split(",").map(t => t.trim()) || [],
    analysis?.Tags?.["Format Tag"]?.split(",").map(t => t.trim()) || [],
    analysis?.Summary || null,
    analysis?.["One-Line Content Summary"] || null,
    analysis?.["Comprehensive Hook Summary"] || null,
    analysis?.["Visual Hook"]?.["Visual Hook Summary"] || null,
    analysis?.["Sound Hook"]?.["Sound Hook Summary"] || null,
    analysis?.["Text Hook"]?.["Text Hook Summary"] || null,
  ];

  const { rows } = await db.query(query, values);
  return rows[0]?.idx;
}

// JSON 전체 items[] 읽어서 반복 삽입
async function insertAllAnalyzedVideos() {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("JSON 구조가 올바르지 않습니다. 'items' 배열이 없습니다.");
    }

    for (const item of data.items) {
      const idx = await insertAnalyzedVideo(item);
      console.log(`✅ Inserted video_code=${item.shortcode}, idx=${idx}`);
    }

    console.log("🎉 모든 데이터 삽입 완료");
  } catch (err) {
    console.error("❌ 데이터 삽입 중 오류:" + err.stack);
  }
}

// 스크립트 단독 실행 시 자동 실행
if (require.main === module) {
  insertAllAnalyzedVideos()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}



module.exports = {
  insertAnalyzedVideo,
  insertAllAnalyzedVideos,
};
