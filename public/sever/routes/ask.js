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
    const chunks = await retrieveChunks(question, 4);

    if (!chunks.length) {
      return res.json({ answer: NOT_FOUND_ANSWER, sources: [], found: false });
    }

    const aiResult = await generateAnswer(question, chunks);

    const sources = formatSourcesFromChunks(chunks);
    return res.json({
      answer: aiResult.found ? aiResult.answer : NOT_FOUND_ANSWER,
      sources: aiResult.found ? sources : [],
      found: aiResult.found,
      safety: safety.suspicious ? { suspicious: true } : undefined
    });
  } catch (error) {
    return res.status(500).json({
      answer: NOT_FOUND_ANSWER,
      sources: [],
      found: false,
      error: error.message
    });
  }
});

export default router;
