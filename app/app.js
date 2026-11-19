// Bootstrap for the Leonida Trophy Guide: loads the trophy data, wires the
// toolbar, tabs, export/import and reset, and re-renders on every change.
import { applyShotPreset, blankState, exportState, isEarned, loadState, parseImport, saveState, toggleEarned } from './state.js';
import { renderChips, renderDetail, renderList, renderProgress, renderRoadmap } from './views.js';

const state = loadState();
const shot = applyShotPreset(state);
let trophies = [];

function renderAll() {
  renderProgress(state, trophies);
  renderChips(state, (kind) => {
    state.kind = kind;
    saveState(state);
    renderAll();
  });
  renderList(state, trophies, selectTrophy, toggleOne);
  renderDetail(state, trophies, toggleOne);
  renderRoadmap(state, trophies, selectTrophy);
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === state.tab);
  });
  for (const id of ['checklist', 'roadmap', 'about']) {
    document.getElementById(`view-${id}`).classList.toggle('hidden', state.tab !== id);
  }
  document.getElementById('toolbar').style.display = state.tab === 'checklist' ? '' : 'none';
  document.getElementById('spoiler-toggle').checked = state.spoiler;
  document.getElementById('hide-earned-toggle').checked = state.hideEarned;
  document.getElementById('grade-filter').value = state.grade;
  if (document.getElementById('search').value !== state.query) {
    document.getElementById('search').value = state.query;
  }
}

function selectTrophy(id) {
  state.selectedId = id;
  state.tab = 'checklist';
  saveState(state);
  renderAll();
  document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function toggleOne(id) {
  toggleEarned(state, id);
  renderAll();
}

function download(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;
  if (!state.selectedId && trophies.length) state.selectedId = trophies[0].id;

  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderAll();
  });
  document.getElementById('grade-filter').addEventListener('change', (e) => {
    state.grade = e.target.value;
    saveState(state);
    renderAll();
  });
  document.getElementById('spoiler-toggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveState(state);
    renderAll();
  });
  document.getElementById('hide-earned-toggle').addEventListener('change', (e) => {
    state.hideEarned = e.target.checked;
    saveState(state);
    renderAll();
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.tab = tab.dataset.tab;
      saveState(state);
      renderAll();
    });
  });
  document.getElementById('export-btn').addEventListener('click', () => {
    download('gta6-trophy-progress.json', exportState(state));
  });
  document.getElementById('import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ids = parseImport(await file.text());
      state.earned = ids;
      saveState(state);
      renderAll();
    } catch {
      alert('That file is not a trophy-progress export from this guide.');
    }
    e.target.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and reset the filters?')) {
      const fresh = blankState();
      fresh.tab = state.tab;
      Object.assign(state, fresh);
      saveState(state);
      renderAll();
    }
  });

  renderAll();
  window.__shotReady = true;
  if (shot) document.title = `Leonida Trophy Guide — shot ${shot}`;
}

boot().catch((err) => {
  document.getElementById('trophy-list').textContent = `Could not load the trophy list: ${err.message}`;
});
