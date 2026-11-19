// Saved progress and filter state for the Leonida Trophy Guide.
// Everything lives in localStorage under one key; the ?shot= demo presets
// below are in-memory only and are never written to storage.
export const STORAGE_KEY = 'gta6-trophy-guide-v1';

const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectibles',
  activity: 'Activities',
  side: 'Side',
  crime: 'Crime',
  economy: 'Economy',
  online: 'Online',
};
export const KIND_ORDER = ['all', 'story', 'missable', 'collectible', 'activity', 'side', 'crime', 'economy', 'online'];

export function kindLabel(kind) {
  return KIND_LABELS[kind] || kind;
}

export function blankState() {
  return {
    earned: [],
    spoiler: false,
    hideEarned: false,
    kind: 'all',
    grade: 'all',
    query: '',
    tab: 'checklist',
    selectedId: null,
  };
}

export function loadState() {
  const state = blankState();
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) return state;
  let saved = null;
  try {
    saved = JSON.parse(raw);
  } catch {
    return state;
  }
  if (!saved || typeof saved !== 'object') return state;
  if (Array.isArray(saved.earned)) state.earned = saved.earned.filter((n) => Number.isInteger(n));
  if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  if (typeof saved.hideEarned === 'boolean') state.hideEarned = saved.hideEarned;
  if (typeof saved.kind === 'string' && KIND_ORDER.includes(saved.kind)) state.kind = saved.kind;
  if (typeof saved.grade === 'string') state.grade = saved.grade;
  if (typeof saved.tab === 'string') state.tab = saved.tab;
  if (Number.isInteger(saved.selectedId)) state.selectedId = saved.selectedId;
  return state;
}

export function saveState(state) {
  const kept = {
    earned: state.earned,
    spoiler: state.spoiler,
    hideEarned: state.hideEarned,
    kind: state.kind,
    grade: state.grade,
    tab: state.tab,
    selectedId: state.selectedId,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Storage full or blocked: the guide still works for this visit.
  }
}

export function exportState(state) {
  return JSON.stringify({ app: 'leonida-trophy-guide', version: 1, earned: [...state.earned].sort((a, b) => a - b) }, null, 2);
}

export function parseImport(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(list)) throw new Error('no earned list');
  const ids = list.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
  return [...new Set(ids)];
}

// Demo presets for screenshots (?shot=cover|roadmap|spoiler|detail).
// They override the visible state in memory only, so a real visitor who
// opens the guide without ?shot= always starts from their own saved state.
export function applyShotPreset(state) {
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return null;
  const demoEarned = [2, 3, 4, 8, 15, 17, 18, 19, 20, 21, 35, 42];
  if (shot === 'cover') {
    state.earned = demoEarned;
    state.selectedId = 17;
    state.tab = 'checklist';
  } else if (shot === 'roadmap') {
    state.earned = demoEarned;
    state.tab = 'roadmap';
  } else if (shot === 'spoiler') {
    state.earned = demoEarned;
    state.spoiler = true;
    state.tab = 'checklist';
  } else if (shot === 'detail') {
    state.earned = demoEarned;
    state.kind = 'collectible';
    state.selectedId = 30;
    state.tab = 'checklist';
  } else {
    return null;
  }
  return shot;
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  if (isEarned(state, id)) {
    state.earned = state.earned.filter((n) => n !== id);
  } else {
    state.earned = [...state.earned, id];
  }
  saveState(state);
}
