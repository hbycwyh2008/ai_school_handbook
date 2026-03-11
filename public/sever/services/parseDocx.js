import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

export async function parseHandbook(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt' || ext === '.md') {
    return fs.readFile(filePath, 'utf8');
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error('Unsupported file type. Use .docx, .txt, or .md');
}
