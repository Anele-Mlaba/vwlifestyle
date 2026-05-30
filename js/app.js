/* VW Lifestyle Club — shared JS (nav, footer, reveals, home, contact, newsletter) */

const VW = {
  paths: {
    home: 'data/home.json',
    gallery: 'data/gallery.json',
    events: 'data/events.json',
    sponsors: 'data/sponsors.json',
    social: 'data/social.json'
  }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

async function loadJSON(path) {
  try {
    const overrides = localStorage.getItem('vw:override:' + path);
    if (overrides) return JSON.parse(overrides);
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (e) {
    console.warn('Failed to load', path, e);
    return null;
  }
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

/* ---------- Header / Nav ---------- */
function initHeader() {
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  const nav = $('.nav');
  if (!header) return;

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.classList.toggle('open', open);
      nav.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setOpen(false)));
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
    });
    // Close if viewport widens past the breakpoint while menu is open
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024 && nav.classList.contains('open')) setOpen(false);
    });
  }

  // Mark active
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.nav a').forEach(a => {
    const target = (a.getAttribute('href') || '').toLowerCase();
    if (target === here || (here === '' && target === 'index.html')) a.classList.add('active');
  });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ---------- Footer (social links) ---------- */
async function initFooter() {
  const slot = $('#footer-social');
  if (!slot) return;
  const social = await loadJSON(VW.paths.social);
  if (!social) return;
  const map = [
    ['Instagram', social.instagram],
    ['TikTok', social.tiktok],
    ['Facebook', social.facebook],
    ['YouTube', social.youtube]
  ];
  slot.innerHTML = map.filter(([_, v]) => v)
    .map(([k, v]) => `<li><a href="${v}" target="_blank" rel="noopener">${k}</a></li>`)
    .join('');
  const contact = $('#footer-contact');
  if (contact) {
    contact.innerHTML = `
      <li><a href="mailto:${social.email}">${social.email}</a></li>
      ${social.phone ? `<li><a href="tel:${social.phone.replace(/\s+/g,'')}">${social.phone}</a></li>` : ''}
      ${social.whatsapp ? `<li><a href="${social.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>` : ''}
    `;
  }
}

/* ---------- Home page ---------- */
async function initHome() {
  if (!$('[data-page="home"]')) return;
  const [home, events, gallery, sponsors] = await Promise.all([
    loadJSON(VW.paths.home),
    loadJSON(VW.paths.events),
    loadJSON(VW.paths.gallery),
    loadJSON(VW.paths.sponsors)
  ]);

  if (home) {
    const h1 = $('.hero h1');
    if (h1) h1.innerHTML = `${home.hero.title} <span class="accent">${home.hero.titleAccent}</span>`;
    const sub = $('.hero .sub');
    if (sub) sub.textContent = home.hero.subtitle;
    const cta = $('.hero .btn.primary');
    if (cta) { cta.textContent = home.hero.ctaLabel; cta.href = home.hero.ctaLink; }
    const vid = $('.hero video source');
    if (vid && home.hero.videoSrc) vid.src = home.hero.videoSrc;
    const v = $('.hero video');
    if (v) v.load();
    const poster = $('.hero video');
    if (poster && home.hero.posterSrc) poster.poster = home.hero.posterSrc;

    const fs = $('#featured-story');
    if (fs && home.featuredStory) {
      fs.querySelector('.eyebrow').textContent = home.featuredStory.kicker;
      fs.querySelector('h2').textContent = home.featuredStory.title;
      fs.querySelector('p').textContent = home.featuredStory.body;
      const img = fs.querySelector('img');
      if (img) { img.src = home.featuredStory.image; img.alt = home.featuredStory.title; }
      const link = fs.querySelector('a.btn');
      if (link) link.href = home.featuredStory.link;
    }

    const statsEl = $('#home-stats');
    if (statsEl && Array.isArray(home.highlights)) {
      statsEl.innerHTML = home.highlights.map(s => `
        <div class="stat">
          <div class="value">${s.value}</div>
          <div class="label">${s.label}</div>
        </div>
      `).join('');
    }
  }

  if (events) {
    const slot = $('#home-events');
    if (slot) {
      slot.innerHTML = events.upcoming.slice(0, 3).map(e => `
        <article class="card reveal">
          <a href="events.html" class="visual"><img src="${e.image}" alt="${e.title}" loading="lazy" onerror="this.style.display='none'"></a>
          <div class="body">
            <div class="meta">${fmtDate(e.date)} · ${e.location}</div>
            <h3>${e.title}</h3>
            <p>${e.summary}</p>
          </div>
          <div class="footer">
            <span>Upcoming</span>
            <a class="link" href="events.html">Details →</a>
          </div>
        </article>
      `).join('');
      initReveal();
    }
  }

  if (gallery) {
    const slot = $('#home-gallery');
    if (slot) {
      slot.innerHTML = gallery.items.slice(0, 6).map((g, i) => `
        <a class="tile reveal delay-${i % 3}" href="gallery.html">
          ${g.type === 'video'
            ? `<img src="${g.poster || ''}" alt="${g.title}" loading="lazy" onerror="this.style.background='#E9F3F9'"><div class="play"><span></span></div>`
            : `<img src="${g.src}" alt="${g.title}" loading="lazy" onerror="this.style.background='#E9F3F9'">`}
          <div class="badge">${g.category}</div>
        </a>
      `).join('');
      initReveal();
    }
  }

  if (sponsors) {
    const slot = $('#home-sponsors');
    if (slot) {
      slot.innerHTML = sponsors.sponsors.slice(0, 8).map(s => `
        <div class="sponsor-cell">
          <div class="logo"><span class="placeholder">${s.name}</span></div>
          <span class="tier">${s.tier}</span>
        </div>
      `).join('');
    }
  }
}

/* ---------- Newsletter ---------- */
function initNewsletter() {
  const form = $('#newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('input[type=email]', form).value.trim();
    const status = $('.status', form.parentElement);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      if (status) status.textContent = 'Please enter a valid email.';
      return;
    }
    // Persist locally for now; real integration is a Phase-2 config in social.json.newsletterEndpoint
    const list = JSON.parse(localStorage.getItem('vw:newsletter') || '[]');
    if (!list.includes(email)) list.push(email);
    localStorage.setItem('vw:newsletter', JSON.stringify(list));
    form.reset();
    if (status) status.textContent = 'You\'re on the list. Watch your inbox.';
  });
}

/* ---------- Contact form ---------- */
function initContact() {
  const form = $('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const status = $('#contact-status');
    if (!data.email || !data.message) {
      if (status) status.textContent = 'Please complete the required fields.';
      return;
    }
    const log = JSON.parse(localStorage.getItem('vw:contact') || '[]');
    log.push({ ...data, at: new Date().toISOString() });
    localStorage.setItem('vw:contact', JSON.stringify(log));
    form.reset();
    if (status) status.textContent = 'Message sent. We\'ll get back to you shortly.';
  });
}

/* ---------- About page (no dynamic content yet) ---------- */
async function initAbout() {
  if (!$('[data-page="about"]')) return;
}

/* ---------- Sponsors page ---------- */
async function initSponsorsPage() {
  if (!$('[data-page="sponsors"]')) return;
  const data = await loadJSON(VW.paths.sponsors);
  if (!data) return;
  const head = $('#sponsors-head');
  if (head) {
    head.querySelector('h1').textContent = data.headline;
    head.querySelector('p').textContent = data.intro;
  }
  const grid = $('#sponsors-grid');
  if (grid) {
    grid.innerHTML = data.sponsors.map(s => `
      <div class="sponsor-cell reveal">
        <div class="logo"><span class="placeholder">${s.name}</span></div>
        <span class="tier">${s.tier}</span>
        <h3>${s.name}</h3>
        <p>${s.description}</p>
      </div>
    `).join('');
  }
  const cta = $('#sponsors-cta');
  if (cta && data.partnership) {
    cta.querySelector('h2').textContent = data.partnership.title;
    cta.querySelector('p').textContent = data.partnership.body;
    const btn = cta.querySelector('.btn');
    if (btn) { btn.textContent = data.partnership.ctaLabel; btn.href = data.partnership.ctaLink; }
  }
  initReveal();
}

/* ---------- Social page ---------- */
async function initSocialPage() {
  if (!$('[data-page="social"]')) return;
  const data = await loadJSON(VW.paths.social);
  if (!data) return;
  const grid = $('#social-cards');
  if (!grid) return;
  const cards = [
    { name: 'Instagram', handle: '@vwlifestyleclub', link: data.instagram },
    { name: 'TikTok', handle: '@vwlifestyleclub', link: data.tiktok },
    { name: 'Facebook', handle: 'VW Lifestyle Club', link: data.facebook },
    { name: 'YouTube', handle: '@vwlifestyleclub', link: data.youtube }
  ];
  grid.innerHTML = cards.filter(c => c.link).map(c => `
    <a class="social-card reveal" href="${c.link}" target="_blank" rel="noopener">
      <div>
        <div class="platform">${c.name}</div>
        <div class="handle">${c.handle}</div>
        <div class="placeholders">
          <div></div><div></div><div></div>
        </div>
      </div>
      <div class="footer-row">
        <span class="eyebrow">Follow</span>
        <span class="arrow">↗</span>
      </div>
    </a>
  `).join('');
  initReveal();
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initReveal();
  initFooter();
  initHome();
  initNewsletter();
  initContact();
  initAbout();
  initSponsorsPage();
  initSocialPage();
});
