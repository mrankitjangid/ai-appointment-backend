const { DateTime } = require('luxon');
const chrono = require('chrono-node');

function normalize(entities, raw_text) {
  const normalized = { date: null, time: null, tz: 'Asia/Kolkata' };
  let confidence = 0;

  try {
    if (entities.date_phrase) {
      const results = chrono.parse(entities.date_phrase, new Date(), { forwardDate: true });
      if (results && results.length) {
        const dt = results[0].start.date();
        if (entities.time_phrase && !results[0].start.isCertain('hour')) {
          const combined = chrono.parse(entities.date_phrase + ' ' + entities.time_phrase, new Date(), { forwardDate: true });
          if (combined && combined.length && combined[0].start.isCertain('hour')) {
            const dt2 = combined[0].start.date();
            const dto = DateTime.fromJSDate(dt2).setZone('Asia/Kolkata');
            normalized.date = dto.toISODate();
            normalized.time = dto.toFormat('HH:mm');
            confidence = 0.95;
            return { normalized, normalization_confidence: confidence };
          }
        }

        const dto = DateTime.fromJSDate(dt).setZone('Asia/Kolkata');
        normalized.date = dto.toISODate();
        if (results[0].start.isCertain && results[0].start.isCertain('hour')) {
          normalized.time = dto.toFormat('HH:mm');
          confidence = 0.95;
        } else {
          normalized.time = null;
          confidence = 0.6;
        }
        return { normalized, normalization_confidence: confidence };
      }
    }

    if (!entities.date_phrase && entities.time_phrase) {
      const t = chrono.parse(entities.time_phrase);
      if (t && t.length && t[0].start.isCertain('hour')) {
        const dt = t[0].start.date();
        const dto = DateTime.fromJSDate(dt).setZone('Asia/Kolkata');
        normalized.date = null;
        normalized.time = dto.toFormat('HH:mm');
        confidence = 0.6;
        return { normalized, normalization_confidence: confidence };
      }
    }

    return { normalized, normalization_confidence: 0 };
  } catch (err) {
    console.error('Normalization error', err);
    return { normalized, normalization_confidence: 0 };
  }
}

module.exports = { normalize };
