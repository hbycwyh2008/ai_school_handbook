import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { parseHandbook } from '../services/parseDocx.js';
import { chunkText } from '../services/chunkText.js';
import { embedTexts } from '../services/embedChunks.js';
import { clearCollection, upsertChunks } from '../services/chromaClient.js';

const router = Router();
const upload = multer({ dest: 'data/handbook/uploads' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    let filePath = req.body.filePath;
    let sourceTitle = req.body.sourceTitle || 'School Handbook';

    if (req.file?.path) {
      filePath = req.file.path;
      sourceTitle = req.file.originalname || sourceTitle;
    }

    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Provide file upload or filePath.' });
    }

    const resolvedPath = path.resolve(filePath);
    const text = await parseHandbook(resolvedPath);
    const chunks = chunkText(text, { sourceTitle });
    const embeddings = await embedTexts(chunks.map((c) => c.text));

    await clearCollection();
    await upsertChunks(chunks, embeddings);

    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    return res.json({
      success: true,
      chunksStored: chunks.length,
      message: 'Handbook ingested successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
