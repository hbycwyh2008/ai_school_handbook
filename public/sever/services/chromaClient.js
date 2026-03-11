const host = process.env.CHROMA_HOST || 'localhost';
const port = process.env.CHROMA_PORT || '8000';
const baseUrl = `http://${host}:${port}/api/v1`;
const collectionName = process.env.CHROMA_COLLECTION || 'school_handbook';

async function chromaFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Chroma error (${response.status}): ${body}`);
  }

  return response.json();
}

export async function ensureCollection() {
  try {
    return await chromaFetch(`/collections/${collectionName}`);
  } catch (_err) {
    return chromaFetch('/collections', {
      method: 'POST',
      body: JSON.stringify({ name: collectionName })
    });
  }
}

export async function clearCollection() {
  await ensureCollection();
  return chromaFetch(`/collections/${collectionName}/delete`, {
    method: 'POST',
    body: JSON.stringify({ where: {} })
  });
}

export async function upsertChunks(chunks, embeddings) {
  await ensureCollection();
  const payload = {
    ids: chunks.map((c) => c.id),
    embeddings,
    documents: chunks.map((c) => c.text),
    metadatas: chunks.map((c) => c.metadata)
  };

  return chromaFetch(`/collections/${collectionName}/upsert`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function queryChunks(queryEmbedding, nResults = 4) {
  await ensureCollection();
  const result = await chromaFetch(`/collections/${collectionName}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query_embeddings: [queryEmbedding],
      n_results: nResults,
      include: ['documents', 'metadatas', 'distances']
    })
  });

  const docs = result.documents?.[0] || [];
  const metadatas = result.metadatas?.[0] || [];

  return docs.map((text, index) => ({
    text,
    metadata: metadatas[index] || {}
  }));
}
