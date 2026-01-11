# AI Appointment Backend

Deterministic appointment parser — lightweight Node/Express service that converts text or an uploaded image into a structured appointment JSON (timezone: Asia/Kolkata).

Quick start

- Install:

```bash
npm install
```

- Run locally:

```bash
npm start
# dev (requires nodemon): npm run dev
```

API

- POST /api/appointments/parse
  - Text input (JSON):

```json
{ "text": "Book dentist next Friday at 3pm" }
```

  - Image upload (multipart/form-data):
  (image_file: IMAGE_FILE_PATH)

```bash
curl -X POST http://localhost:3000/api/appointments/parse \
  -F "image_file=@/full/path/to/image.jpg"
```

Responses

- Success (`status: ok`): returns `appointment` with `department`, `date` (YYYY-MM-DD), `time` (HH:MM), and `tz` (Asia/Kolkata).
- Clarification (`status: needs_clarification`): returned when date/time/department are ambiguous/missing or confidence is low.

Notes

- Deterministic pipeline: OCR (`tesseract.js`) → entity extraction (`chrono-node` + keywords) → normalization (`luxon`) → guardrails.
- No LLMs or external databases.
- `tesseract.js` may be unreliable in some serverless environments (e.g., Vercel). For production, consider a hosted OCR provider.
