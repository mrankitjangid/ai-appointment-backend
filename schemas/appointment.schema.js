const { z } = require('zod');

const inputSchema = z.object({
  text: z.string().optional()
});

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
