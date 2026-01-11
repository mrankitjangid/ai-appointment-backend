# AI Appointment Backend

Deterministic appointment parsing backend that converts freeform text or image-based appointment requests into structured scheduling JSON. The service is implemented in Node.js (Express) and is designed to run serverless on Vercel via a small wrapper.

--

## Tech Stack

- Node.js, Express
- OCR: `tesseract.js` (local / WASM)
- NLP / Date parsing: `chrono-node` (deterministic)
- Text processing: `compromise` (minimal, optional)
- Timezone handling: `luxon` (Asia/Kolkata)
- Schema validation: `zod`
- Serverless wrapper: `serverless-http` (for Vercel deployment)

## Architecture Overview

- Request -> `POST /api/appointments/parse`
- Controller (`src/controllers/appointment.controller.js`) orchestrates the pipeline
- Services implement business logic and return pure JSON:
  - `src/services/ocr.service.js` — OCR / text extraction (or passthrough for text input)
  - `src/services/entity.service.js` — Extract `date_phrase`, `time_phrase`, and `department` (keyword dictionary + `chrono-node`)
  - `src/services/normalize.service.js` — Convert phrases to ISO date/time in `Asia/Kolkata` using `luxon`
  - `src/services/guardrail.service.js` — Enforce rules (missing fields, multiple matches, confidence thresholds)
- Outputs validated by Zod schemas in `src/schemas/appointment.schema.js`

Notes:
- Business logic is fully deterministic and rule-based; no LLMs or external AI models are used.
- The service is stateless and requires no database.

## File Structure

- `src/` — main application source
  - `routes/appointment.routes.js`
  - `controllers/appointment.controller.js`
  - `services/*.js` (ocr, entity, normalize, guardrail)
  - `schemas/appointment.schema.js`
  - `utils/textCleaner.js`, `utils/confidence.js`
- `api/index.js` — serverless wrapper for Vercel
- `postman/` — Postman collection + environment for testing

--

## Setup (Local)

1. Install dependencies

```bash
npm install
```

2. Run locally

```bash
npm start
# or for development (requires nodemon)
npm run dev
```

Server will start on `http://localhost:3000` by default.

## Environment & Deployment Notes

- There is no required `.env` for the basic deterministic pipeline. If you later plug in an external OCR provider, add credentials to a `.env` and update `ocr.service.js` accordingly.
- Deploying to Vercel: this repo includes `api/index.js` and `vercel.json` so pushing to Vercel should work. Caveat: `tesseract.js` uses WASM and may not function reliably in Vercel's serverless environment — consider using an external OCR API if you see failures.

## API: POST /api/appointments/parse

Endpoint specification

- URL: `/api/appointments/parse`
- Method: `POST`
- Content-Type: `application/json`
- Body (one of the following):
  - Text input

```json
{
  "text": "Book dentist next Friday at 3pm"
}
```

  - Image input (base64)

```json
{
  "image_base64": "<BASE64_STRING>"
}
```

Pipeline steps (deterministic): OCR -> Entity Extraction -> Normalization (Asia/Kolkata) -> Guardrails -> Final Output

## Examples

- Text request (curl):

```bash
curl -X POST http://localhost:3000/api/appointments/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"Book dentist next Friday at 3pm"}'
```

- Image request (curl):

```bash
curl -X POST http://localhost:3000/api/appointments/parse \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"<BASE64_IMAGE>"}'
```

## Postman

- Import `postman/ai-appointment.postman_collection.json` into Postman and use the provided environment `postman/ai-appointment.postman_environment.json` (set `base_url` to `http://localhost:3000` for local testing).

## Testing & Validation

- All inputs and outputs are validated using Zod schemas in `src/schemas/appointment.schema.js`.
- Run basic smoke tests by sending the example requests above. If the app crashes, check logs and ensure dependencies are installed.

## Caveats & Next Steps

- OCR reliability on serverless platforms: If you plan to deploy to Vercel for production usage, consider swapping `tesseract.js` for a hosted OCR API (Google Vision, AWS Textract) and move heavy OCR processing off the serverless function.
- Add unit tests for services (entity extraction, normalization, guardrails). I can scaffold Jest tests if you want.
- Add more department keywords or a configurable department list.

## Contact

If you'd like, I can:
- Add a `.env.example` and switch the OCR service to use an external provider.
- Add unit tests and CI.
- Run a smoke test locally and confirm endpoints.
