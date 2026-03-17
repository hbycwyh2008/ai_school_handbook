import { Router } from 'express';
import { retrieveChunks } from '../services/retrieveChunks.js';
import { generateAnswer } from '../services/generateAnsers.js';
import { safetyCheck } from '../services/safetyCheck.js';
import { formatSourcesFromChunks } from '../utils/formatSources.js';
import { NOT_FOUND_ANSWER } from '../prompts/systemPrompt.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const question = req.body?.question?.trim();
    if (!question) {
      return res.status(400).json({ message: 'question is required' });
    }

    const safety = safetyCheck(question);
    const chunks = await retrieveChunks(question, 6);

    console.log(`[ask] question="${question}" chunks_found=${chunks.length}`);
    if (chunks.length > 0) {
      console.log(`[ask] top chunk section="${chunks[0].metadata?.section}" text_preview="${chunks[0].text?.slice(0, 80)}..."`);
    }

    if (!chunks.length) {
      console.log('[ask] no chunks retrieved from ChromaDB');
      return res.json({ answer: NOT_FOUND_ANSWER, sources: [], found: false });
    }

    const aiResult = await generateAnswer(question, chunks);
    console.log(`[ask] ai_result found=${aiResult.found}`);

    const sources = formatSourcesFromChunks(chunks);
    return res.json({
      answer: aiResult.answer,
      sources: aiResult.found ? sources : [],
      found: aiResult.found,
      safety: safety.suspicious ? { suspicious: true } : undefined
    });
  } catch (error) {
    console.error('[ask] error:', error.message);
    return res.status(500).json({
      answer: NOT_FOUND_ANSWER,
      sources: [],
      found: false,
      error: error.message
    });
  }
});

export default router;
