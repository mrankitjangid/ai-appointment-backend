const { inputSchema, finalAppointmentSchema } = require('../schemas/appointment.schema');
const ocrService = require('../services/ocr.service');
const entityService = require('../services/entity.service');
const normalizeService = require('../services/normalize.service');
const guardrailService = require('../services/guardrail.service');
const { computeFinalConfidence } = require('../utils/confidence');

async function parseAppointment(req, res) {
  try {
    // If a multipart file was uploaded, prefer that over body input
    let input = null;
    if (req.file && req.file.buffer) {
      input = { file: req.file.buffer };
    } else {
      const parseResult = inputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ status: 'error', message: 'Invalid input', issues: parseResult.error.errors });
      }
      input = parseResult.data;
    }

    // Step 1: OCR / Text Extraction
    const ocrOut = await ocrService.extractText(input);

    if (!ocrOut.raw_text || ocrOut.confidence === 0) {
      return res.json({ status: 'needs_clarification', message: 'Unable to extract text from image' });
    }

    // Step 2: Entity Extraction
    const entityOut = entityService.extractEntities(ocrOut.raw_text);

    // Step 3: Normalization
    const normOut = normalizeService.normalize(entityOut.entities, ocrOut.raw_text);

    // Step 4: Guardrails
    const finalConfidence = computeFinalConfidence(ocrOut.confidence, entityOut.entities_confidence, normOut.normalization_confidence);

    const guard = guardrailService.check({
      entities: entityOut.entities,
      entities_confidence: entityOut.entities_confidence,
      normalization: normOut.normalized,
      normalization_confidence: normOut.normalization_confidence,
      ocr_confidence: ocrOut.confidence,
      final_confidence: finalConfidence,
      multiple_date_time: entityOut.multiple_date_time
    });

    if (guard.status === 'needs_clarification') {
      return res.json(guard);
    }

    // Step 5: Final Appointment Output
    const appointment = {
      department: entityOut.entities.department,
      date: normOut.normalized.date,
      time: normOut.normalized.time,
      tz: normOut.normalized.tz || 'Asia/Kolkata'
    };

    const response = {
      appointment,
      status: 'ok',
      confidence: finalConfidence
    };

    const finalCheck = finalAppointmentSchema.safeParse(response);
    if (!finalCheck.success) {
      return res.status(500).json({ status: 'error', message: 'Final output validation failed', issues: finalCheck.error.errors });
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { parseAppointment };
