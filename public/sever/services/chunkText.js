function splitSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentTitle = 'General';
  let buffer = [];

  const flush = () => {
    const content = buffer.join('\n').trim();
    if (content) sections.push({ title: currentTitle, content });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { buffer.push(line); continue; }

    const isNumberedHeading = /^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 80;
    const isAllCapsHeading = /^[A-Z][A-Z\s\-:&/]{4,}$/.test(trimmed) && trimmed.length < 80;
    const isMarkdownHeading = /^#{1,4}\s+/.test(trimmed);
    const isHeading = (isNumberedHeading || isAllCapsHeading || isMarkdownHeading) && trimmed.length > 3;

    if (isHeading && buffer.length > 0) {
      flush();
      currentTitle = trimmed.replace(/^#{1,4}\s+/, '');
    } else if (isHeading) {
      currentTitle = trimmed.replace(/^#{1,4}\s+/, '');
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections.length ? sections : [{ title: 'General', content: text }];
}

export function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize ?? 1200;
  const overlap = options.overlap ?? 200;
  const sourceTitle = options.sourceTitle ?? 'School Handbook';
  const numPages = options.numPages ?? null;

  const sections = splitSections(text);
  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionText = `[${section.title}]\n${section.content}`;
    let start = 0;

    while (start < sectionText.length) {
      const end = Math.min(start + chunkSize, sectionText.length);
      let slice = sectionText.slice(start, end).trim();

      if (start > 0 && !slice.startsWith('[')) {
        slice = `[${section.title}] (continued)\n${slice}`;
      }

      if (slice) {
        chunks.push({
          id: `${Date.now()}-${chunkIndex}`,
          text: slice,
          metadata: {
            sourceTitle,
            section: section.title || null,
            page: null,
            chunkIndex,
            version: null
          }
        });
        chunkIndex += 1;
      }
      if (end >= sectionText.length) break;
      start = Math.max(0, end - overlap);
    }
  }

  if (numPages != null && numPages > 0 && chunks.length > 0) {
    for (let i = 0; i < chunks.length; i++) {
      const pageNum = Math.min(numPages, Math.max(1, Math.round(((i + 0.5) / chunks.length) * numPages)));
      chunks[i].metadata.page = pageNum;
    }
  }

  return chunks;
}
  