/* Gallery page — filters + lightbox */

(function () {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  const filtersEl = document.getElementById('gallery-filters');
  const lightbox = document.getElementById('lightbox');
  const lbMedia = lightbox && lightbox.querySelector('.lb-media');
  const lbCaption = lightbox && lightbox.querySelector('.caption');
  const lbClose = lightbox && lightbox.querySelector('.close');
  const lbPrev = lightbox && lightbox.querySelector('.nav-btn.prev');
  const lbNext = lightbox && lightbox.querySelector('.nav-btn.next');

  let items = [];
  let current = [];
  let active = 'All';
  let cursor = 0;

  async function load() {
    const override = localStorage.getItem('vw:override:data/gallery.json');
    if (override) {
      const d = JSON.parse(override);
      return d;
    }
    const res = await fetch('data/gallery.json', { cache: 'no-cache' });
    return await res.json();
  }

  function render() {
    current = active === 'All' ? items.slice() : items.filter(i => i.category === active);
    grid.innerHTML = current.map((g, i) => `
      <div class="tile reveal" data-index="${i}">
        ${g.type === 'video'
          ? `<img src="${g.poster || ''}" alt="${g.title}" loading="lazy" onerror="this.style.background='#E9F3F9'"><div class="play"><span></span></div>`
          : `<img src="${g.src}" alt="${g.title}" loading="lazy" onerror="this.style.background='#E9F3F9'">`}
        <div class="badge">${g.category}</div>
      </div>
    `).join('');
    grid.querySelectorAll('.tile').forEach(t => {
      t.addEventListener('click', () => open(parseInt(t.dataset.index, 10)));
    });
    // animate
    requestAnimationFrame(() => grid.querySelectorAll('.tile').forEach((t, i) => {
      setTimeout(() => t.classList.add('in'), i * 30);
    }));
  }

  function buildFilters(categories) {
    if (!filtersEl) return;
    filtersEl.innerHTML = categories.map(c => `<button data-cat="${c}" class="${c === active ? 'active' : ''}">${c}</button>`).join('');
    filtersEl.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        active = b.dataset.cat;
        filtersEl.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        render();
      });
    });
  }

  function open(i) {
    if (!lightbox) return;
    cursor = i;
    show();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    if (lbMedia) lbMedia.innerHTML = '';
    document.body.style.overflow = '';
  }
  function show() {
    const item = current[cursor];
    if (!item || !lbMedia) return;
    lbMedia.innerHTML = item.type === 'video'
      ? `<video src="${item.src}" controls autoplay playsinline></video>`
      : `<img src="${item.src}" alt="${item.title}">`;
    if (lbCaption) lbCaption.textContent = `${item.title}${item.caption ? ' — ' + item.caption : ''}`;
  }
  function next() { cursor = (cursor + 1) % current.length; show(); }
  function prev() { cursor = (cursor - 1 + current.length) % current.length; show(); }

  if (lbClose) lbClose.addEventListener('click', close);
  if (lbPrev) lbPrev.addEventListener('click', prev);
  if (lbNext) lbNext.addEventListener('click', next);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  load().then(data => {
    items = data.items || [];
    buildFilters(data.categories || ['All']);
    render();
  }).catch(err => {
    console.warn(err);
    grid.innerHTML = '<p>Gallery unavailable.</p>';
  });
})();
