const metaOEmbedService = require("../services/metaOEmbed.service")

/**
 * Instagram oEmbed 컨트롤러 (Thin Controller)
 *
 * @route GET /api/oembed/instagram
 *
 * @query {string}  url                 (필수) 퍼블릭 Instagram 콘텐츠 URL
 * @query {'true'|'false'} [omitscript] (선택) 응답에 embed.js 포함 여부 ('true' 권장)
 * @query {number} [maxwidth]           (선택) 320–658px 범위
 *
 * @response 200
 *   { ok: true, embed: { html }, meta: { ... }, client: { requiresEmbedJs, notes } }
 * @response 4xx/5xx
 *   { ok: false, error: { message, ... } }
 */
exports.getInstagramOEmbed = async (req, res) => {
    try {
        const { url, omitscript, maxwidth } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ ok: false, error: { message: 'Missing or invalid url' } });
        }
  
        const result = await metaOEmbedService.fetchInstagramEmbed({ url, omitscript, maxwidth });
        // result: { embed, meta, client }
        return res.json({ ok: true, ...result });
    } catch (err) {
        return res.status(err.status || 500).json({
            ok: false,
            error: err.details || { message: err.message },
        });
    }
};