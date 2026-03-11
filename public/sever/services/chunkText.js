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
      const isHeading = /^([A-Z][A-Za-z0-9\s\-:&]{3,}|\d+\.[\s\w\-]+)/.test(trimmed) && trimmed.length < 100;
  
      if (isHeading && buffer.length > 0) {
        flush();
        currentTitle = trimmed;
      } else if (isHeading) {
        currentTitle = trimmed;
      } else {
        buffer.push(line);
      }
    }
    flush();
    return sections.length ? sections : [{ title: 'General', content: text }];
  }
  
  export function chunkText(text, options = {}) {
    const chunkSize = options.chunkSize ?? 900;
    const overlap = options.overlap ?? 120;
    const sourceTitle = options.sourceTitle ?? 'School Handbook';
    const numPages = options.numPages ?? null;
  
    const sections = splitSections(text);
    const chunks = [];
    let chunkIndex = 0;
  
    for (const section of sections) {
      let start = 0;
      const content = section.content;
  
      while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);
        const slice = content.slice(start, end).trim();
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
        if (end >= content.length) break;
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
  