# AI School Handbook Assistant (MVP)

A simple RAG web app that answers questions from a single school handbook only.

## Features
- Ingest one handbook (`.docx`, `.txt`, `.md`)
- Parse + chunk text with metadata
- Embed chunks with OpenAI embeddings
- Store and query chunks in ChromaDB
- Ask questions through `/api/ask`
- Grounded answers with citations
- Not-found behavior when evidence is insufficient
- Basic prompt-injection checks

## Setup
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in `OPENAI_API_KEY`.
3. Start ChromaDB (example docker):
   ```bash
   docker run -p 8000:8000 chromadb/chroma
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the app:
   ```bash
   npm start
   ```

## API
### `GET /api/health`
Returns `{ "ok": true }`.

### `POST /api/ingest`
Upload a file (multipart `file`) or provide `filePath` in JSON/form body.

Response:
```json
{
  "success": true,
  "chunksStored": 123,
  "message": "Handbook ingested successfully."
}
```

### `POST /api/ask`
Request:
```json
{ "question": "What is the late work policy?" }
```

Response:
```json
{
  "answer": "...",
  "sources": [
    {
      "sourceTitle": "Student Handbook 2025-2026",
      "section": "Late Work Policy",
      "page": 12,
      "quote": "Late assignments may receive reduced credit..."
    }
  ],
  "found": true
}
```

Not found:
```json
{
  "answer": "I could not find a supported answer in the handbook.",
  "sources": [],
  "found": false
}
```

## Notes
- The model is instructed to use **only retrieved context**.
- If retrieval is empty/weak, API returns not found.
- UI is a single page in `public/`.
