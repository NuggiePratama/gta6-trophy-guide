// Rendering for the Leonida Trophy Guide: the checklist, the trophy detail
// panel, and the five-stage roadmap to the platinum.
import { isEarned, kindLabel, KIND_ORDER } from './state.js';

export const STAGES = [
  {
    n: 1,
    title: 'Stage 1 — Story playthrough',
    note: 'Play Chapters 1–4 and the final mission in order. Do every missable trophy in this stage before the final mission — story moments do not come back. Partner robberies, the airport departure and the showroom smash all live here.',
  },
  {
    n: 2,
    title: 'Stage 2 — Stranger strands & NPC finales',
    note: 'Work the stranger missions and the side characters\u2019 final missions (Andy, Kenton, Billy, Randy, Tyrone, Bret). Finish 8 full stranger strands for the silver.',
  },
  {
    n: 3,
    title: 'Stage 3 — Activities & challenges',
    note: 'Races, the shooting range, fishing, arcade games, bowling, meditation, drone races, stunts and the combat trophies. The 42 gold Shooting Range medals are the long grind — start them early and do a few per session.',
  },
  {
    n: 4,
    title: 'Stage 4 — Collectibles & exploration',
    note: 'Cards, WAiNK It spots, challenges, vehicles, all 52 areas of Leonida, garage properties and Scooter Bros registrations. Tour the map and grab things as you pass them.',
  },
  {
    n: 5,
    title: 'Stage 5 — Cleanup & platinum',
    note: 'Launder the last Marked Bills, spend the last dollars, and let 100% completion and the platinum land. When this stage is done, the guide is done.',
  },
];

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function storyHidden(state, trophy) {
  return state.spoiler && trophy.kind === 'story' && !isEarned(state, trophy.id);
}

export function visibleTrophies(state, trophies) {
  const q = state.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.kind === 'online') return false;
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.hideEarned && isEarned(state, t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function renderChips(state, onPick) {
  const box = document.getElementById('kind-chips');
  box.replaceChildren();
  for (const kind of KIND_ORDER) {
    const chip = el('button', 'chip' + (state.kind === kind ? ' active' : ''), kindLabel(kind));
    chip.type = 'button';
    chip.addEventListener('click', () => onPick(kind));
    box.append(chip);
  }
}

export function renderProgress(state, trophies) {
  const earned = state.earned.length;
  const total = trophies.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById('progress-count').textContent = `${earned} of ${total} earned`;
  document.getElementById('progress-pct').textContent = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const counts = {};
  for (const t of trophies) counts[t.grade] = (counts[t.grade] || 0) + 1;
  const got = {};
  for (const t of trophies) if (isEarned(state, t.id)) got[t.grade] = (got[t.grade] || 0) + 1;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map(
    (g) => `${got[g] || 0}/${counts[g] || 0} ${g}`,
  );
  document.getElementById('grade-counts').textContent = parts.join(' · ');
}

export function renderList(state, trophies, onSelect, onToggle) {
  const list = document.getElementById('trophy-list');
  const shown = visibleTrophies(state, trophies);
  const count = document.getElementById('result-count');
  if (state.kind === 'online') {
    count.textContent = 'Online: none — all 55 trophies are single-player. There are no online trophies in the official list.';
  } else {
    count.textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  }
  list.replaceChildren();
  for (const t of shown) {
    const hidden = storyHidden(state, t);
    const row = el('li', 'trophy-row' + (isEarned(state, t.id) ? ' earned' : '') + (state.selectedId === t.id ? ' selected' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, t.id);
    box.setAttribute('aria-label', `Mark ${hidden ? 'hidden story trophy' : t.name} as earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => onToggle(t.id));
    const body = el('div');
    const name = el('div', 'trophy-name', hidden ? 'Hidden story trophy' : t.name);
    const desc = el('div', 'trophy-desc' + (hidden ? ' locked' : ''), hidden ? 'Earn it to reveal its name and description.' : t.description);
    const meta = el('div', 'trophy-meta');
    meta.append(el('span', `badge ${t.grade}`, t.grade));
    meta.append(el('span', 'tag', kindLabel(t.kind)));
    if (t.missable) meta.append(el('span', 'tag missable', '⚠ Missable'));
    meta.append(el('span', 'tag', `Stage ${t.stage}`));
    body.append(name, desc, meta);
    row.append(box, body, el('span', 'tag', 'Guide ›'));
    row.addEventListener('click', () => onSelect(t.id));
    list.append(row);
  }
  if (!shown.length && state.kind !== 'online') {
    const empty = el('li', 'trophy-row');
    empty.append(el('div', 'locked', 'No trophies match these filters. Clear the search or pick another kind.'));
    list.append(empty);
  }
}

export function renderDetail(state, trophies, onToggle) {
  const panel = document.getElementById('detail');
  panel.replaceChildren();
  const t = trophies.find((x) => x.id === state.selectedId);
  if (!t) {
    panel.append(el('p', 'empty', 'Select a trophy on the left to read its guide and sources.'));
    const hint = el('p', 'empty', 'Every guide is written in this guide\u2019s own words and cites its sources — the PlayStation official description and the Exophase and PSNProfiles trophy lists.');
    panel.append(hint);
    return;
  }
  const hidden = storyHidden(state, t);
  const earned = isEarned(state, t.id);
  panel.append(el('h2', '', hidden ? 'Hidden story trophy' : t.name));
  const meta = el('div', 'trophy-meta');
  meta.append(el('span', `badge ${t.grade}`, t.grade));
  meta.append(el('span', 'tag', kindLabel(t.kind)));
  if (t.missable) meta.append(el('span', 'tag missable', '⚠ Missable'));
  meta.append(el('span', 'tag', `Roadmap stage ${t.stage}`));
  panel.append(meta);
  panel.append(el('p', 'trophy-desc', hidden ? 'Earn it to reveal its name and description.' : t.description));
  if (!hidden) {
    if (t.missable && t.missable_reason) {
      panel.append(el('div', 'missable-banner', `⚠ Missable — ${t.missable_reason}`));
    }
    panel.append(el('p', 'guide', t.guide));
    const src = el('div', 'sources');
    src.append(el('strong', '', 'Sources: '));
    const ul = document.createElement('ul');
    for (const s of t.sources) ul.append(el('li', '', s));
    src.append(ul);
    panel.append(src);
  } else {
    panel.append(el('p', 'locked', 'Spoilers are on: the guide for this story trophy stays hidden until you earn it.'));
  }
  const btn = el('button', 'earn-btn' + (earned ? ' earned' : ''), earned ? '✓ Earned — click to unmark' : 'Mark as earned');
  btn.type = 'button';
  btn.addEventListener('click', () => onToggle(t.id));
  panel.append(btn);
}

export function renderRoadmap(state, trophies, onSelect) {
  const box = document.getElementById('stages');
  box.replaceChildren();
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => isEarned(state, t.id)).length;
    const card = el('article', 'stage');
    const h = el('h2', '', `${stage.title} `);
    h.append(el('span', 'stage-count', `— ${done} of ${members.length} earned`));
    card.append(h, el('p', '', stage.note));
    const ul = el('ul', 'stage-list');
    for (const t of members) {
      const li = el('li', isEarned(state, t.id) ? 'earned' : '');
      li.append(el('span', `dot ${t.grade}`));
      const name = el('span', '', storyHidden(state, t) ? 'Hidden story trophy' : t.name);
      li.append(name);
      if (t.missable) li.append(el('span', 'tag missable', '⚠ Missable'));
      li.append(el('span', 'stage-note', t.kind === 'story' && t.description.startsWith('Complete') ? t.description : kindLabel(t.kind)));
      li.addEventListener('click', () => onSelect(t.id));
      ul.append(li);
    }
    card.append(ul);
    box.append(card);
  }
}
