function check({ entities, entities_confidence, normalization, normalization_confidence, ocr_confidence, final_confidence, multiple_date_time }) {
  if (multiple_date_time) {
    return { status: 'needs_clarification', message: 'Multiple date/time expressions detected' };
  }

  if (!entities || !entities.date_phrase || !entities.time_phrase) {
    return { status: 'needs_clarification', message: 'Date or time missing' };
  }

  if (!entities.department) {
    return { status: 'needs_clarification', message: 'Department not recognized' };
  }

  if (final_confidence < 0.75 || ocr_confidence < 0.4 || entities_confidence < 0.4 || normalization_confidence < 0.4) {
    return { status: 'needs_clarification', message: 'Low confidence in parsed data' };
  }

  return { status: 'ok' };
}

module.exports = { check };
