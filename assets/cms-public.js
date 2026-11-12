(() => {
  const labels = {
    publications: 'Latest research & publications',
    events: 'Events & experiences',
    clients: 'Our partners',
    team: 'Meet the team',
    initiatives: 'Our initiatives',
    'site-updates': 'Latest updates'
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function render(mount) {
    const category = mount.dataset.cmsList;
    try {
      const response = await fetch(`/content/${encodeURIComponent(category)}.json`, { cache: 'no-cache' });
      if (!response.ok) return;
      const items = await response.json();
      if (!Array.isArray(items)) return;
      const published = items.filter(item => item && item.published).sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      if (!published.length) return;
      const cards = published.map(item => {
        const media = Array.isArray(item.media_urls) ? item.media_urls : [];
        const image = media.find(url => /\.(png|jpe?g|webp)(\?|$)/i.test(url));
        const pdf = media.find(url => /\.pdf(\?|$)/i.test(url));
        const visual = image ? `<img class="cms-public-media" src="${esc(image)}" alt="${esc(item.title)}" loading="lazy">` : '';
        const date = item.date ? `<time datetime="${esc(item.date)}">${new Date(`${item.date}T00:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</time>` : '';
        const link = item.link_url || pdf;
        const action = link ? `<a class="cms-public-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Explore ↗</a>` : '';
        return `<article class="cms-public-card">${visual}<div class="cms-public-body">${date}<h3>${esc(item.title)}</h3><p>${esc(item.description)}</p>${action}</div></article>`;
      }).join('');
      mount.innerHTML = `<div class="cms-public-heading"><span>180DC ARSD / ${esc(category.replace('-', ' '))}</span><h2>${labels[category] || 'Latest updates'}</h2></div><div class="cms-public-grid">${cards}</div>`;
    } catch (error) {
      console.warn(`Could not load CMS content for ${category}.`, error);
    }
  }
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-cms-list]').forEach(render));
})();
