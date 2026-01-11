function cleanText(s) {
  if (!s) return '';
  let t = s.replace(/\r\n|\r/g, '\n');
  t = t.replace(/[\u2018\u2019]/g, "'");
  t = t.replace(/[\u201C\u201D]/g, '"');
  t = t.replace(/[^\S\n]+/g, ' ');
  t = t.replace(/\n{2,}/g, '\n');
  t = t.trim();
  return t;
}

module.exports = { cleanText };
