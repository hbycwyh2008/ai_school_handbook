function isMeaningfulQuote(text) {
    const t = (text || '').trim();
    return t.length > 0 && t !== '—' && t !== '–' && t !== '-';
  }

  /** Deduplicate by (sourceTitle, section, page); keep one quote per location, prefer meaningful text. */
  export function formatSourcesFromChunks(chunks) {
    const byKey = new Map();
    for (const chunk of chunks) {
      const sourceTitle = chunk.metadata?.sourceTitle || 'School Handbook';
      const section = chunk.metadata?.section ?? null;
      const page = chunk.metadata?.page ?? null;
      const key = `${sourceTitle}\t${section}\t${page}`;
      const quote = (chunk.text || '').slice(0, 220).trim();
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { sourceTitle, section, page, quote });
      } else if (isMeaningfulQuote(quote) && !isMeaningfulQuote(existing.quote)) {
        existing.quote = quote;
      }
    }
    return Array.from(byKey.values());
  }
  