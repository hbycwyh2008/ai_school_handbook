import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { parseHandbook } from '../services/parseDocx.js';
import { chunkText } from '../services/chunkText.js';
import { embedTexts } from '../services/embedChunks.js';
import { clearCollection, upsertChunks, getIngestStatus } from '../services/chromaClient.js';

const router = Router();
const upload = multer({ dest: 'data/handbook/uploads' });
const MAX_FILES = 20;

router.get('/status', async (_req, res) => {
  try {
    const { hasData, count } = await getIngestStatus();
    return res.json({ hasData, count });
  } catch (err) {
    return res.json({ hasData: false, count: 0 });
  }
});

router.post('/', upload.array('file', MAX_FILES), async (req, res) => {
  let stage = 'validate-input';
  try {
    const replaceExisting = req.body.replaceExisting !== 'false';
    const files = Array.isArray(req.files) && req.files.length > 0
      ? req.files
      : req.file
        ? [req.file]
        : [];

    if (files.length === 0 && !req.body.filePath) {
      return res.status(400).json({ success: false, message: 'Provide at least one file or filePath.' });
    }

    const allChunks = [];
    const sourceSummaries = [];

    if (files.length > 0) {
      for (const f of files) {
        stage = 'parse-handbook';
        const sourceTitle = f.originalname || 'Handbook';
        const resolvedPath = path.resolve(f.path);
        const parsed = await parseHandbook(resolvedPath, sourceTitle);
        const text = typeof parsed === 'string' ? parsed : (parsed?.text ?? '');
        const numPages = typeof parsed === 'object' && parsed != null && 'numPages' in parsed ? parsed.numPages : null;
        stage = 'chunk-text';
        const chunks = chunkText(text, { sourceTitle, numPages });
        allChunks.push(...chunks);
        sourceSummaries.push({ name: sourceTitle, chunks: chunks.length });
        await fs.unlink(f.path).catch(() => {});
      }
    } else {
      const filePath = path.resolve(req.body.filePath);
      const sourceTitle = req.body.sourceTitle || 'School Handbook';
      const parsed = await parseHandbook(filePath, sourceTitle);
      const text = typeof parsed === 'string' ? parsed : (parsed?.text ?? '');
      const numPages = typeof parsed === 'object' && parsed != null && 'numPages' in parsed ? parsed.numPages : null;
      const chunks = chunkText(text, { sourceTitle, numPages });
      allChunks.push(...chunks);
      sourceSummaries.push({ name: sourceTitle, chunks: chunks.length });
    }

    if (allChunks.length === 0) {
      return res.status(400).json({ success: false, message: 'No content extracted from the provided file(s).' });
    }

    stage = 'create-embeddings';
    let embeddings;
    try {
      embeddings = await embedTexts(allChunks.map((c) => c.text));
    } catch (err) {
      console.error('[ingest] embedding API error', err);
      return res.status(500).json({
        success: false,
        message: `Embedding API error: ${err.message || 'fetch failed'}. Check OPENAI_API_KEY and BASE_URL (and network/proxy).`,
      });
    }

    if (replaceExisting) {
      stage = 'clear-chroma-collection';
      try {
        await clearCollection();
      } catch (err) {
        console.error('[ingest] Chroma clear error', err);
        return res.status(500).json({
          success: false,
          message: `Chroma error: ${err.message || 'fetch failed'}. Is Chroma running on localhost:8000?`,
        });
      }
    }

    stage = 'upsert-chunks';
    try {
      await upsertChunks(allChunks, embeddings);
    } catch (err) {
      console.error('[ingest] Chroma upsert error', err);
      return res.status(500).json({
        success: false,
        message: `Chroma upsert error: ${err.message}. Is Chroma running on localhost:8000?`,
      });
    }

    return res.json({
      success: true,
      chunksStored: allChunks.length,
      sources: sourceSummaries,
      sourceTitle: sourceSummaries.length === 1 ? sourceSummaries[0].name : undefined,
      message: sourceSummaries.length > 1
        ? `Ingested ${sourceSummaries.length} files. ${allChunks.length} chunks stored.`
        : 'Handbook ingested successfully.',
    });
  } catch (error) {
    console.error('[ingest] failed at stage:', stage, error);
    return res.status(500).json({
      success: false,
      message: `${error.message || 'Unknown error'}`,
    });
  }
});

export default router;
