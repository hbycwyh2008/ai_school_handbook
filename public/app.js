const form = document.getElementById('ask-form');
const questionInput = document.getElementById('question');
const statusEl = document.getElementById('status');
const answerEl = document.getElementById('answer');
const sourcesEl = document.getElementById('sources');

const ingestForm = document.getElementById('ingest-form');
const ingestStatusEl = document.getElementById('ingest-status');
const handbookFileInput = document.getElementById('handbook-file');
const handbookPathInput = document.getElementById('handbook-path');
const fileSelectButton = document.getElementById('file-select-button');
const fileSelectedText = document.getElementById('file-selected-text');

function renderSources(sources) {
  sourcesEl.innerHTML = '';
  if (!sources?.length) {
    const item = document.createElement('li');
    item.className = 'muted';
    item.textContent = 'No sources available.';
    sourcesEl.appendChild(item);
    return;
  }

  for (const src of sources) {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${src.sourceTitle || 'School Handbook'}</strong><br>
      <span>Section: ${src.section || 'N/A'} | Page: ${src.page ?? 'N/A'}</span>
      <p>“${src.quote || ''}”</p>
    `;
    sourcesEl.appendChild(item);
  }
}

if (fileSelectButton && handbookFileInput && fileSelectedText) {
  fileSelectButton.addEventListener('click', () => {
    handbookFileInput.click();
  });

  handbookFileInput.addEventListener('change', () => {
    const file = handbookFileInput.files[0];
    fileSelectedText.textContent = file ? file.name : 'No file chosen';
  });
}

ingestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  ingestStatusEl.textContent = 'Uploading and indexing handbook...';

  try {
    const formData = new FormData();
    const file = handbookFileInput.files[0];
    const pathText = handbookPathInput.value.trim();

    if (file) {
      formData.append('file', file);
    }

    if (pathText) {
      formData.append('filePath', pathText);
    }

    if (!file && !pathText) {
      ingestStatusEl.textContent = 'Please choose a file or enter a file path.';
      return;
    }

    const response = await fetch('/api/ingest', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      ingestStatusEl.textContent = `Ingested handbook successfully. Chunks stored: ${data.chunksStored}.`;
    } else {
      ingestStatusEl.textContent = `Ingest failed: ${data.message || 'Unknown error'}`;
    }
  } catch (error) {
    ingestStatusEl.textContent = `Ingest error: ${error.message}`;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;

  statusEl.textContent = 'Loading...';
  answerEl.textContent = '';
  sourcesEl.innerHTML = '';

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    answerEl.textContent = data.answer || 'No answer.';
    renderSources(data.sources || []);

    if (data.found === false) {
      statusEl.textContent = 'Not found in handbook.';
    } else {
      statusEl.textContent = 'Done.';
    }
  } catch (error) {
    statusEl.textContent = 'Error contacting backend.';
    answerEl.textContent = error.message;
  }
});
