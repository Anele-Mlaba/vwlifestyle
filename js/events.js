/* Events page */

(function () {
  const upcomingEl = document.getElementById('events-upcoming');
  const pastEl = document.getElementById('events-past');
  if (!upcomingEl && !pastEl) return;

  function fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  }

  function card(e, isPast) {
    return `
      <article class="card reveal">
        <div class="visual"><img src="${e.image}" alt="${e.title}" loading="lazy" onerror="this.style.background='#E9F3F9'"></div>
        <div class="body">
          <div class="meta">${fmtDate(e.date)} · ${e.location}</div>
          <h3>${e.title}</h3>
          <p>${e.summary}</p>
        </div>
        <div class="footer">
          <span>${isPast ? 'Past event' : 'Upcoming'}</span>
          ${!isPast && e.ctaLink ? `<a class="link" href="${e.ctaLink}">${e.ctaLabel || 'Details'} →</a>` : '<span></span>'}
        </div>
      </article>
    `;
  }

  async function load() {
    const override = localStorage.getItem('vw:override:data/events.json');
    if (override) return JSON.parse(override);
    const res = await fetch('data/events.json', { cache: 'no-cache' });
    return await res.json();
  }

  load().then(data => {
    if (upcomingEl) upcomingEl.innerHTML = (data.upcoming || []).map(e => card(e, false)).join('');
    if (pastEl) pastEl.innerHTML = (data.past || []).map(e => card(e, true)).join('');

    // animate
    document.querySelectorAll('.card.reveal').forEach((c, i) => setTimeout(() => c.classList.add('in'), i * 60));
  }).catch(err => {
    console.warn(err);
    if (upcomingEl) upcomingEl.innerHTML = '<p>Events unavailable.</p>';
  });
})();
