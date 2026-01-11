const chrono = require('chrono-node');

const DEPARTMENTS = {
  dentist: 'Dentistry',
  dentistry: 'Dentistry',
  dental: 'Dentistry',
  cardiology: 'Cardiology',
  cardiologist: 'Cardiology',
  dermatologist: 'Dermatology',
  dermatology: 'Dermatology',
  optometrist: 'Optometry',
  eye: 'Optometry',
  general: 'General',
  gp: 'General'
};

function findDepartment(text) {
  if (!text) return null;
  const lowered = text.toLowerCase();
  for (const key of Object.keys(DEPARTMENTS)) {
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(lowered)) return DEPARTMENTS[key];
  }
  return null;
}

function extractEntities(raw_text) {
  const entities = { date_phrase: null, time_phrase: null, department: null };

  const results = chrono.parse(raw_text);

  if (results && results.length) {
    const first = results[0];
    entities.date_phrase = first.text;
    if (first.start && first.start.isCertain && first.start.isCertain('hour')) {
      const timeMatch = first.text.match(/\b(\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i);
      if (timeMatch) entities.time_phrase = timeMatch[0];
    }
  }

  if (!entities.time_phrase) {
    const timeResults = chrono.parse(raw_text, new Date(), { forwardDate: true });
    if (timeResults && timeResults.length) {
      const withHour = timeResults.find(r => r.start && r.start.isCertain && r.start.isCertain('hour'));
      if (withHour) entities.time_phrase = withHour.text;
    }
  }

  const dept = findDepartment(raw_text);
  entities.department = dept;

  const present = ['date_phrase', 'time_phrase', 'department'].reduce((acc, k) => acc + (entities[k] ? 1 : 0), 0);
  const entities_confidence = present / 3;

  const multiple_date_time = results.length > 1;

  return { entities, entities_confidence, multiple_date_time };
}

module.exports = { extractEntities };
