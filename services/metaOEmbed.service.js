// services/metaOEmbed.service.js
const axios = require('axios');
const  { metaTokenService }  = require('./metaToken.service'); // App Token 발급/캐시 서비스

const OEMBED_URL = 'https://graph.facebook.com/v23.0/instagram_oembed';

/** 내부: 파라미터 정규화 */
function normalizeParams({ url, omitscript, maxwidth }) {
  if (!url || typeof url !== 'string') {
    const e = new Error('url is required');
    e.status = 400;
    throw e;
  }

  // caption은 항상 노출
  const hidecaption = 'false';

  // embed.js 중복 로드 방지 목적: 기본값 'true'
  const omit = String(omitscript ?? 'true').toLowerCase() === 'false' ? 'false' : 'true';

  // 320–658px로 클램프
  let width;
  if (maxwidth !== undefined) {
    const n = parseInt(maxwidth, 10);
    if (!Number.isNaN(n)) {
      width = Math.max(320, Math.min(658, n));
    }
  }

  return { url, hidecaption, omitscript: omit, maxwidth: width };
}

/** 내부: 응답 정규화 */
function normalizeResponse(data, requiresEmbedJs) {
  return {
    embed: { html: data?.html ?? '' },
    meta: {
      author_name: data?.author_name ?? null,
      provider_url: data?.provider_url ?? null,
      title: data?.title ?? null,
      thumbnail_url: data?.thumbnail_url ?? null,
    },
    client: {
      requiresEmbedJs,
      notes: '동적 삽입 시 embed.js 로드 후 window.instgrm?.Embeds.process() 호출',
    },
  };
}

/**
 * Instagram oEmbed 호출 (서비스)
 * - caption 항상 표시(hidecaption='false')
 * - omitscript 기본 'true' (프론트에서 embed.js 1회 로드 권장)
 * - maxwidth 320–658px 클램프
 * - oEmbed는 like/view 지표 미제공
 *
 * @param {Object} args
 * @param {string} args.url
 * @param {'true'|'false'} [args.omitscript]
 * @param {number|string} [args.maxwidth]
 * @returns {Promise<{embed:{html:string}, meta:Object, client:{requiresEmbedJs:boolean, notes:string}}>}
 */
exports.fetchInstagramEmbed = async ({ url, omitscript, maxwidth }) => {
  const params = normalizeParams({ url, omitscript, maxwidth });

  const accessToken = await metaTokenService.get(); // 서버 보관 App Token
  const query = {
    url: params.url,
    hidecaption: params.hidecaption,
    omitscript: params.omitscript,
    access_token: accessToken,
  };
  if (params.maxwidth) query.maxwidth = params.maxwidth;

  try {
    const { data } = await axios.get(OEMBED_URL, { params: query, timeout: 10_000 });
    return normalizeResponse(data, params.omitscript === 'true');
  } catch (err) {
    const status = err.response?.status || 500;
    const payload = err.response?.data || { message: err.message };

    // 권한/검수 미완료 힌트 보강
    const msg = String(payload?.error?.message || '');
    if (msg.includes('oEmbed Read')) {
      payload.hint = "앱에 'oEmbed Read' 기능 활성화 및 App Review(Advanced Access) 필요";
    }

    const e = new Error('oEmbed 요청 실패');
    e.status = status;
    e.details = payload;
    throw e;
  }
};