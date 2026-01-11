const { z } = require('zod');

const inputSchema = z.object({
  text: z.string().optional(),
  image_base64: z.string().optional()
}).refine(data => data.text || data.image_base64, { message: 'Either text or image_base64 must be provided' });

const finalAppointmentSchema = z.object({
  appointment: z.object({
    department: z.string(),
    date: z.string(),
    time: z.string(),
    tz: z.string()
  }),
  status: z.string(),
  confidence: z.number().min(0).max(1).optional()
});

module.exports = { inputSchema, finalAppointmentSchema };
