export function formatSourcesFromChunks(chunks) {
    return chunks.map((chunk) => ({
      sourceTitle: chunk.metadata?.sourceTitle || 'School Handbook',
      section: chunk.metadata?.section || null,
      page: chunk.metadata?.page ?? null,
      quote: chunk.text.slice(0, 220)
    }));
  }
  