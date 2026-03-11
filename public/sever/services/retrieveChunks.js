import { embedTexts } from './embedChunks.js';
import { queryChunks } from './chromaClient.js';

export async function retrieveChunks(question, k = 4) {
  const [queryEmbedding] = await embedTexts([question]);
  return queryChunks(queryEmbedding, k);
}
