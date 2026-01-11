const Tesseract = require('tesseract.js');
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

  // Use Tesseract.recognize directly with a CDN-hosted corePath to avoid relying on local WASM files
  const corePath = process.env.TESSERACT_CORE_PATH || 'https://cdn.jsdelivr.net/npm/tesseract.js-core@2.1.1/tesseract-core-simd.wasm';
  try {
    const { data } = await Tesseract.recognize(buffer, 'eng', { corePath, logger: () => {} });
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
  } catch (err) {
    console.error('OCR error', err);
    return { raw_text: '', confidence: 0 };
  }
}

module.exports = { extractText };
