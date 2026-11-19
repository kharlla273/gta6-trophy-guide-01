// The Leonida Trophy Guide: a checklist of the 55 official GTA VI trophies with a
// cited guide each, a roadmap to the platinum, kind/grade filters, a spoiler mode
// that hides story trophies until earned, and progress saved in localStorage with
// export/import. Static only: it fetches data/trophies.json from its own folder
// and makes no network request anywhere else.
const KEY = 'gta6-trophy-progress-v1';
const SPOILER_KEY = 'gta6-trophy-spoiler-v1';
const HIDDEN_NAME = 'Hidden story trophy';
const HIDDEN_DESC = 'Hidden until earned — turn spoiler mode off, or earn this trophy, to reveal it.';

// Roadmap stages, built from the official trophy descriptions: story chapters and
// missions first, then contacts and strangers, exploration and collectibles,
// activities, crime and money, and finally 100% completion and the platinum.
const ROADMAP = [
  { title: 'Stage 1 — Play the story', text: 'Follow the main missions in order: the opening mission, Chapters 1–4, the named missions and the finale. Chapter and mission trophies unlock as the story advances.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { title: 'Stage 2 — Friends, contacts & strangers', text: 'Finish the mission strands for Andy, Kenton, Billy, Randy and Tyrone, complete 8 stranger strands across Leonida, and hunt the unique animal for Bret.', ids: [22, 23, 24, 26, 27, 25, 29] },
  { title: 'Stage 3 — Explore Leonida & collect', text: 'Cover all 52 areas, discover 100 vehicles, meditate at all 18 spots, WAiNK It at 100 locations, complete 3 card sets, and buy all 8 garage properties.', ids: [42, 35, 28, 31, 30, 54] },
  { title: 'Stage 4 — Activities & challenges', text: 'Try all 9 activity types, land 250 stunts, gold all 42 Shooting Range challenges, win 20 races and drone races at all 14 locations, beat Cal at fishing, finish an arcade game and a bowling game, and complete 50 challenges.', ids: [16, 15, 17, 19, 18, 20, 21, 46, 32] },
  { title: 'Stage 5 — Crime, money & the partner', text: 'Rob vaults, an armored truck and a jewelry store undetected, hit one illegal operation per gang, pull off the partner jobs, launder $250,000 in marked bills, spend $100,000 in shops, and register 10 vehicles in the Scooter Bros app.', ids: [40, 41, 39, 43, 34, 33, 36, 37, 38, 44, 45, 47, 48, 49, 50, 51, 52, 53, 55] },
  { title: 'Stage 6 — Cleanup & 100%', text: 'Sweep up anything left, reach 100% completion for the gold, and the platinum follows on its own.', ids: [14, 1] },
];

const cardsEl = document.getElementById('cards');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const unearnedEl = document.getElementById('unearned-only');
const spoilerEl = document.getElementById('spoiler');
const spoilerNote = document.getElementById('spoiler-note');
const countLine = document.getElementById('count-line');
const emptyEl = document.getElementById('empty');

let earned = new Set(loadProgress());
let trophies = [];
let byId = new Map();

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function spoilerOn() {
  return spoilerEl.checked;
}

function trophyIsHidden(t) {
  return spoilerOn() && t.kind === 'story' && !earned.has(t.name);
}

function renderRoadmap() {
  const list = document.getElementById('roadmap-list');
  list.replaceChildren();
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    li.append(h, p);
    const names = document.createElement('p');
    names.className = 'stage-trophies';
    const stageTrophies = stage.ids.map((id) => byId.get(id)).filter(Boolean);
    if (spoilerOn()) {
      const hidden = stageTrophies.filter((t) => t.kind === 'story' && !earned.has(t.name)).length;
      const shown = stageTrophies.filter((t) => !(t.kind === 'story' && !earned.has(t.name)));
      names.textContent = shown.map((t) => t.name).join(' · ')
        + (hidden ? (shown.length ? ' · ' : '') + `${hidden} story troph${hidden === 1 ? 'y' : 'ies'} hidden by spoiler mode` : '');
    } else {
      names.textContent = stageTrophies.map((t) => t.name).join(' · ');
    }
    li.append(names);
    list.append(li);
  }
}

function renderMissables() {
  const list = document.getElementById('missable-list');
  list.replaceChildren();
  const flagged = trophies.filter((t) => t.missable !== 'no');
  if (!flagged.length) {
    const li = document.createElement('li');
    li.textContent = 'No trophy is flagged as missable.';
    list.append(li);
    return;
  }
  for (const t of flagged) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = `${t.name} — ${t.missable === 'possible' ? 'possibly missable' : 'missability unknown'}`;
    const span = document.createElement('span');
    span.className = 'why';
    span.textContent = ` — ${t.missable_note}`;
    li.append(strong, span);
    list.append(li);
  }
}

function gradeBadge(grade) {
  const s = document.createElement('span');
  s.className = `grade ${grade}`;
  s.textContent = grade;
  return s;
}

function flagEl(text, cls) {
  const s = document.createElement('span');
  s.className = `flag ${cls}`;
  s.textContent = text;
  return s;
}

function renderCards() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  const unearnedOnly = unearnedEl.checked;
  cardsEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (kind === 'missable' && t.missable === 'no') continue;
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) continue;
    if (grade !== 'all' && t.grade !== grade) continue;
    if (unearnedOnly && earned.has(t.name)) continue;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) continue;
    shown += 1;
    const hidden = trophyIsHidden(t);
    const card = document.createElement('article');
    card.className = `card${earned.has(t.name) ? ' earned' : ''}`;
    const head = document.createElement('div');
    head.className = 'card-head';
    const h = document.createElement('h3');
    h.textContent = hidden ? HIDDEN_NAME : t.name;
    head.append(h, gradeBadge(t.grade));
    card.append(head);
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = hidden ? HIDDEN_DESC : `“${t.description}”`;
    card.append(official);
    if (!hidden) {
      const guide = document.createElement('p');
      guide.className = 'guide';
      guide.textContent = t.guide;
      card.append(guide);
      const source = document.createElement('p');
      source.className = 'source';
      source.textContent = `Source: ${t.source}`;
      card.append(source);
    }
    const flags = document.createElement('div');
    flags.className = 'flags';
    flags.append(flagEl(t.kind, `kind-${t.kind}`));
    if (t.missable === 'possible') flags.append(flagEl('Possibly missable', 'missable-possible'));
    else if (t.missable === 'unknown') flags.append(flagEl('Missability unknown', 'missable-unknown'));
    card.append(flags);
    const earn = document.createElement('label');
    earn.className = 'earn';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveProgress();
      renderAll();
    });
    earn.append(box, document.createTextNode(box.checked ? 'Earned ✓' : 'Mark as earned'));
    card.append(earn);
    cardsEl.append(card);
  }
  emptyEl.hidden = shown > 0;
  if (kind === 'online') {
    emptyEl.textContent = 'No online trophies: the official list has no online trophies, so this filter is empty by design.';
  } else {
    emptyEl.textContent = 'No trophies match these filters.';
  }
  countLine.textContent = `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned`;
}

function renderProgress() {
  const total = trophies.length || 55;
  const pct = Math.round((earned.size / total) * 100);
  const bar = document.querySelector('.progress-bar');
  const fill = document.getElementById('progress-fill');
  fill.style.width = `${pct}%`;
  bar.setAttribute('aria-valuenow', String(earned.size));
  bar.setAttribute('aria-valuemax', String(total));
  bar.setAttribute('aria-valuetext', `${earned.size} of ${total} trophies earned`);
  document.getElementById('progress').textContent = `${earned.size} of ${total} earned · ${pct}%`;
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderCards();
  spoilerNote.hidden = !spoilerOn();
}

function downloadProgress() {
  const blob = new Blob([JSON.stringify([...earned].sort(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  const raw = JSON.parse(await file.text());
  if (!Array.isArray(raw)) throw new Error('Progress file must be a JSON array of trophy names.');
  const known = new Set(trophies.map((t) => t.name));
  const next = new Set(raw.filter((n) => typeof n === 'string' && known.has(n)));
  earned = next;
  saveProgress();
  renderAll();
}

async function init() {
  const res = await fetch('data/trophies.json');
  const doc = await res.json();
  trophies = doc.trophies;
  byId = new Map(trophies.map((t) => [t.id, t]));
  earned = new Set([...earned].filter((n) => trophies.some((t) => t.name === n)));
  spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';
  searchEl.addEventListener('input', renderCards);
  kindEl.addEventListener('change', renderCards);
  gradeEl.addEventListener('change', renderCards);
  unearnedEl.addEventListener('change', renderCards);
  spoilerEl.addEventListener('change', () => {
    localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
    renderAll();
  });
  document.getElementById('export').addEventListener('click', downloadProgress);
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importProgress(file);
    } catch (err) {
      alert(`Could not import progress: ${err.message}`);
    }
    e.target.value = '';
  });
  renderMissables();
  renderAll();
}

init();
