/* VW Lifestyle Club — admin panel */

const PASSWORD = 'vwclub';
const SESSION_KEY = 'vw:admin:session';

const FILES = {
  home: '../data/home.json',
  gallery: '../data/gallery.json',
  events: '../data/events.json',
  sponsors: '../data/sponsors.json',
  social: '../data/social.json'
};

// Keys used by the public site (relative paths from root)
const PUBLIC_KEYS = {
  home: 'data/home.json',
  gallery: 'data/gallery.json',
  events: 'data/events.json',
  sponsors: 'data/sponsors.json',
  social: 'data/social.json'
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const state = { home: null, gallery: null, events: null, sponsors: null, social: null };

/* ---------- Login ---------- */
function showShell() {
  $('#login').classList.add('hidden');
  $('#shell').classList.remove('hidden');
  boot();
}

function checkSession() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') showShell();
}

$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const pw = $('#pw').value;
  if (pw === PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showShell();
  } else {
    $('#login-error').textContent = 'Wrong password.';
  }
});

$('#logout').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

/* ---------- Data load ---------- */
async function loadSection(name) {
  // Prefer local overrides (admin edits persisted in localStorage), fall back to JSON file
  const override = localStorage.getItem('vw:override:' + PUBLIC_KEYS[name]);
  if (override) {
    state[name] = JSON.parse(override);
    return;
  }
  const res = await fetch(FILES[name], { cache: 'no-cache' });
  state[name] = await res.json();
}

function saveSection(name) {
  localStorage.setItem('vw:override:' + PUBLIC_KEYS[name], JSON.stringify(state[name]));
}

function resetSection(name) {
  if (!confirm('Discard local edits for ' + name + ' and re-read from the JSON file?')) return;
  localStorage.removeItem('vw:override:' + PUBLIC_KEYS[name]);
  loadSection(name).then(() => { bindAll(); renderLists(); });
}

function exportSection(name) {
  const blob = new Blob([JSON.stringify(state[name], null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name + '.json'; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Two-way bindings ---------- */
function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}
function setByPath(obj, path, val) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((o, k) => (o[k] = o[k] || {}), obj);
  target[last] = val;
}

function bindAll() {
  $$('[data-bind]').forEach(input => {
    const path = input.dataset.bind;
    const val = getByPath(state, path);
    if (val !== undefined && val !== null) input.value = val;
    input.oninput = () => setByPath(state, path, input.value);
  });
}

/* ---------- Tabs ---------- */
$$('#admin-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('#admin-tabs button').forEach(b => b.classList.toggle('active', b === btn));
    $$('[data-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== btn.dataset.tab));
  });
});

/* ---------- Save / Export / Reset wiring ---------- */
function wireGlobal() {
  $$('[data-save]').forEach(b => b.addEventListener('click', () => {
    saveSection(b.dataset.save);
    flash(b, 'Saved');
  }));
  $$('[data-export]').forEach(b => b.addEventListener('click', () => exportSection(b.dataset.export)));
  $$('[data-reset]').forEach(b => b.addEventListener('click', () => resetSection(b.dataset.reset)));
}

function flash(btn, msg) {
  const orig = btn.textContent;
  btn.textContent = msg;
  setTimeout(() => btn.textContent = orig, 1200);
}

/* ---------- Gallery list ---------- */
function renderGalleryList() {
  const list = $('#g-list');
  if (!list || !state.gallery) return;
  list.innerHTML = (state.gallery.items || []).map((g, i) => `
    <div class="admin-item">
      <img src="${g.type === 'video' ? (g.poster || '') : g.src}" alt="" onerror="this.style.background='#E9F3F9'">
      <div class="meta-text">
        <strong>${g.title}</strong>
        ${g.category} · ${g.type}${g.caption ? ' · ' + g.caption : ''}
      </div>
      <button data-rm-gallery="${i}">Remove</button>
    </div>
  `).join('');
  list.querySelectorAll('[data-rm-gallery]').forEach(b => b.addEventListener('click', () => {
    const idx = parseInt(b.dataset.rmGallery, 10);
    state.gallery.items.splice(idx, 1);
    saveSection('gallery');
    renderGalleryList();
  }));
}

function wireGallery() {
  const typeSel = $('#g-type');
  const posterWrap = $('#g-poster-wrap');
  const toggle = () => posterWrap.style.display = typeSel.value === 'video' ? '' : 'none';
  typeSel.addEventListener('change', toggle); toggle();

  $('#g-add').addEventListener('click', () => {
    const item = {
      id: Date.now(),
      type: typeSel.value,
      category: $('#g-category').value,
      title: $('#g-title').value || 'Untitled',
      caption: $('#g-caption').value,
      src: $('#g-src').value
    };
    if (item.type === 'video') item.poster = $('#g-poster').value;
    if (!item.src) { alert('Media path required'); return; }
    state.gallery = state.gallery || { categories: [], items: [] };
    state.gallery.items.unshift(item);
    saveSection('gallery');
    renderGalleryList();
    ['g-title','g-caption','g-src','g-poster'].forEach(id => $('#' + id).value = '');
  });
}

/* ---------- Events list ---------- */
function renderEventsList() {
  const up = $('#e-upcoming'); const past = $('#e-past');
  if (!up || !state.events) return;
  const render = (arr, where, kind) => arr.map((e, i) => `
    <div class="admin-item">
      <img src="${e.image}" alt="" onerror="this.style.background='#E9F3F9'">
      <div class="meta-text">
        <strong>${e.title}</strong>
        ${e.date} · ${e.location}<br>${e.summary || ''}
      </div>
      <button data-rm-event="${kind}:${i}">Remove</button>
    </div>
  `).join('');
  up.innerHTML = render(state.events.upcoming || [], up, 'upcoming');
  past.innerHTML = render(state.events.past || [], past, 'past');
  $$('[data-rm-event]').forEach(b => b.addEventListener('click', () => {
    const [kind, i] = b.dataset.rmEvent.split(':');
    state.events[kind].splice(parseInt(i, 10), 1);
    saveSection('events');
    renderEventsList();
  }));
}

function wireEvents() {
  $('#e-add').addEventListener('click', () => {
    const status = $('#e-status').value;
    const ev = {
      id: 'evt-' + Date.now(),
      title: $('#e-title').value || 'New event',
      date: $('#e-date').value,
      location: $('#e-location').value,
      summary: $('#e-summary').value,
      image: $('#e-image').value
    };
    if (status === 'upcoming') {
      ev.ctaLabel = 'Details';
      ev.ctaLink = $('#e-link').value || 'contact.html';
    }
    state.events = state.events || { upcoming: [], past: [] };
    state.events[status].unshift(ev);
    saveSection('events');
    renderEventsList();
    ['e-title','e-date','e-location','e-summary','e-image','e-link'].forEach(id => $('#' + id).value = '');
  });
}

/* ---------- Sponsors list ---------- */
function renderSponsorsList() {
  const list = $('#s-list');
  if (!list || !state.sponsors) return;
  list.innerHTML = (state.sponsors.sponsors || []).map((s, i) => `
    <div class="admin-item">
      <img src="${s.logo}" alt="" onerror="this.style.background='#E9F3F9'">
      <div class="meta-text">
        <strong>${s.name}</strong>
        ${s.tier}<br>${s.description || ''}
      </div>
      <button data-rm-sponsor="${i}">Remove</button>
    </div>
  `).join('');
  $$('[data-rm-sponsor]').forEach(b => b.addEventListener('click', () => {
    state.sponsors.sponsors.splice(parseInt(b.dataset.rmSponsor, 10), 1);
    saveSection('sponsors');
    renderSponsorsList();
  }));
}

function wireSponsors() {
  $('#s-add').addEventListener('click', () => {
    const sp = {
      id: 'sp-' + Date.now(),
      name: $('#s-name').value || 'New Sponsor',
      tier: $('#s-tier').value,
      description: $('#s-desc').value,
      logo: $('#s-logo').value,
      link: $('#s-link').value || '#'
    };
    state.sponsors = state.sponsors || { headline: '', intro: '', sponsors: [] };
    state.sponsors.sponsors.unshift(sp);
    saveSection('sponsors');
    renderSponsorsList();
    ['s-name','s-desc','s-logo','s-link'].forEach(id => $('#' + id).value = '');
  });
}

/* ---------- Newsletter subs ---------- */
function renderSubs() {
  const list = $('#subs-list');
  if (!list) return;
  const subs = JSON.parse(localStorage.getItem('vw:newsletter') || '[]');
  if (!subs.length) { list.innerHTML = '<p style="color: var(--mute-2); margin: 0;">No subscribers yet.</p>'; return; }
  list.innerHTML = subs.map((email, i) => `
    <div class="admin-item">
      <div></div>
      <div class="meta-text"><strong>${email}</strong></div>
      <button data-rm-sub="${i}">Remove</button>
    </div>
  `).join('');
  $$('[data-rm-sub]').forEach(b => b.addEventListener('click', () => {
    const subs = JSON.parse(localStorage.getItem('vw:newsletter') || '[]');
    subs.splice(parseInt(b.dataset.rmSub, 10), 1);
    localStorage.setItem('vw:newsletter', JSON.stringify(subs));
    renderSubs();
  }));
  $('#export-subs').onclick = () => {
    const csv = 'email\n' + subs.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };
}

function renderLists() {
  renderGalleryList();
  renderEventsList();
  renderSponsorsList();
  renderSubs();
}

/* ---------- Boot ---------- */
async function boot() {
  await Promise.all(Object.keys(FILES).map(loadSection));
  bindAll();
  wireGlobal();
  wireGallery();
  wireEvents();
  wireSponsors();
  renderLists();
}

checkSession();
