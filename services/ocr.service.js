const Tesseract = require('tesseract.js');
const axios = require('axios');
const { cleanText } = require('../utils/textCleaner');

async function extractText(input) {
  // text input
  if (input.text) {
    const cleaned = cleanText(input.text);
    return { raw_text: cleaned, confidence: 0.95 };
  }

  // file buffer input (from multer memory storage)
  let buffer = null;
  if (input.file && Buffer.isBuffer(input.file)) {
    buffer = input.file;
  } else if (input.image_base64) {
    buffer = Buffer.from(input.image_base64, 'base64');
  }

  if (!buffer) {
    return { raw_text: '', confidence: 0 };
  }

  // Prefer Tesseract with explicit corePath when available. On Vercel serverless
  // environments the local WASM file may be missing; in that case fall back to
  // an external OCR provider (OCR.Space) if configured.
  const corePathEnv = process.env.TESSERACT_CORE_PATH;
  const defaultCdn = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@2.1.1/tesseract-core-simd.wasm';

  async function tryTesseract(cp) {
    const { data } = await Tesseract.recognize(buffer, 'eng', { corePath: cp, logger: () => {} });
    const raw = data && data.text ? data.text : '';
    const cleaned = cleanText(raw);

    let conf = 0;
    if (typeof data.confidence === 'number') {
      conf = Math.max(0, Math.min(1, data.confidence / 100));
    } else if (data && data.words && data.words.length) {
      const avg = data.words.reduce((s, w) => s + (w.confidence || 0), 0) / data.words.length;
      conf = Math.max(0, Math.min(1, avg / 100));
    } else {
      conf = 0.6;
    }

    return { raw_text: cleaned, confidence: conf };
  }

  // If the user explicitly configured an external OCR provider, prefer that
  // on serverless platforms (VERCEL) or when the env var is set. Otherwise try
  // tesseract with configured corePath or the CDN fallback.
  const useExternal = !!process.env.OCR_SPACE_API_KEY || !!process.env.FORCE_EXTERNAL_OCR || !!process.env.VERCEL;

  if (!useExternal) {
    // try explicit env var first
    try {
      const cp = corePathEnv || defaultCdn;
      return await tryTesseract(cp);
    } catch (err) {
      console.warn('Tesseract failed, will attempt external OCR fallback:', err && err.message ? err.message : err);
      // fall through to external fallback below
    }
  }

  // External OCR.Space fallback (recommended for serverless production)
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`;
    const params = new URLSearchParams();
    params.append('base64Image', base64);
    params.append('apikey', apiKey);
    params.append('language', 'eng');

    const resp = await axios.post('https://api.ocr.space/parse/image', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 20000,
    });

    const d = resp.data;
    if (!d || d.IsErroredOnProcessing) {
      console.error('OCR.Space errored', d);
      return { raw_text: '', confidence: 0 };
    }

    const parsed = (d.ParsedResults && d.ParsedResults[0] && d.ParsedResults[0].ParsedText) ? d.ParsedResults[0].ParsedText : '';
    const cleaned = cleanText(parsed || '');
    // OCR.Space doesn't guarantee a normalized confidence value — use heuristics
    let conf = 0.7;
    if (d.ParsedResults && d.ParsedResults[0] && typeof d.ParsedResults[0].FileParseExitCode === 'number') {
      conf = d.ParsedResults[0].FileParseExitCode === 1 ? 0.85 : 0.6;
    }

    return { raw_text: cleaned, confidence: conf };
  } catch (err) {
    console.error('External OCR failed', err && err.message ? err.message : err);
    return { raw_text: '', confidence: 0 };
  }
}

module.exports = { extractText };
