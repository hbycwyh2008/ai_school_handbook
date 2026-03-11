import OpenAI from 'openai';

const apiKey = process.env.SG_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.BASE_URL || 'https://sg.uiuiapi.com/v1';

const client = new OpenAI({
  apiKey,
  baseURL,
});
const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export async function embedTexts(texts) {
  const response = await client.embeddings.create({
    model: embeddingModel,
    input: texts
  });

  return response.data.map((row) => row.embedding);
}
