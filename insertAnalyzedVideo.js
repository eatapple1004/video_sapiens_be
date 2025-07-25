const fs = require('fs');
const { Pool } = require('pg');

// DB 연결 설정
const pool = new Pool({
  user: 'ateam',
  host: '172.30.1.80',
  database: 'shortform_db',
  password: '0518',
  port: 5432,
});

// JSON 배열 로딩
const raw = fs.readFileSync('./video_data_list.json', 'utf-8');
const dataList = JSON.parse(raw);

// INSERT 함수
async function insertVideo(video) {
  const parsed = {
    platform: video.platform,
    video_code: video.video_code,
    title: video.Title,
    topic_tag: video['Main Tags']?.split(',').map(t => t.trim()) || [],
    genre_tag: video.Tags?.['Genre Tag']?.split(',').map(t => t.trim()) || [],
    format_tag: video.Tags?.['Format Tag']?.split(',').map(t => t.trim()) || [],
    summary: video.Summary,
    one_line_summary: video['One-Line Content Summary'],
    hook_summary: video['Comprehensive Hook Summary'],
    visual_hook_summary: video['Visual Hook']?.['Visual Hook Summary'],
    sound_hook_summary: video['Sound Hook']?.['Sound Hook Summary'],
    text_hook_summary: video['Text Hook']?.['Text Hook Summary'],
  };

  const query = `
    INSERT INTO analyzed_video (
      video_idx, platform, video_code, title,
      topic_tag, genre_tag, format_tag,
      summary, one_line_summary, hook_summary,
      visual_hook_summary, sound_hook_summary, text_hook_summary,
      created_at, updated_at
    ) VALUES (
      (SELECT idx FROM post WHERE shortcode = $1),
      $2, $3, $4,
      $5, $6, $7,
      $8, $9, $10,
      $11, $12, $13,
      NOW(), NOW()
    );
  `;

  const values = [
    parsed.video_code,
    parsed.platform,
    parsed.video_code,
    parsed.title,
    parsed.topic_tag,
    parsed.genre_tag,
    parsed.format_tag,
    parsed.summary,
    parsed.one_line_summary,
    parsed.hook_summary,
    parsed.visual_hook_summary,
    parsed.sound_hook_summary,
    parsed.text_hook_summary,
  ];

  try {
    await pool.query(query, values);
    console.log(`✅ Inserted: ${parsed.video_code}`);
  } catch (err) {
    console.error(`❌ Failed: ${parsed.video_code} - ${err.message}`);
  }
}

// 전체 실행
(async () => {
  for (const video of dataList) {
    await insertVideo(video);
  }
  await pool.end();
})();
