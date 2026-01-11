function computeFinalConfidence(ocr_conf, entities_conf, normalization_conf) {
  const o = typeof ocr_conf === 'number' ? ocr_conf : 0;
  const e = typeof entities_conf === 'number' ? entities_conf : 0;
  const n = typeof normalization_conf === 'number' ? normalization_conf : 0;
  const final = o * 0.3 + e * 0.3 + n * 0.4;
  return Math.max(0, Math.min(1, final));
}

module.exports = { computeFinalConfidence };
