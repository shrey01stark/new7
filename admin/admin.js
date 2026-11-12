(() => {
  const $ = (id) => document.getElementById(id);
  const labels = {
    publications: ['Publications & R&D', 'Research reports, frameworks and industry insights.'],
    events: ['Events & galleries', 'Event announcements, recaps, dates and photo galleries.'],
    clients: ['Clients & partners', 'Client and partner profiles, logos and descriptions.'],
    team: ['Team members', 'People, roles, profiles and headshots.'],
    initiatives: ['Initiatives', 'Programmes, projects and ongoing initiatives.'],
    'site-updates': ['Site updates', 'General announcements and website updates.']
  };
  let category = 'publications';
  let currentItems = [];
  let currentMedia = [];
  let toastTimer;

  function message(target, text, error = true) {
    $(target).textContent = text;
    $(target).style.color = error ? 'var(--red)' : 'var(--green2)';
  }
  function toast(text) {
    $('toast').textContent = text;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  async function api(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }
  function showDashboard(user) {
    $('loginView').classList.add('hidden');
    $('dashboardView').classList.remove('hidden');
    $('signOutBtn').classList.remove('hidden');
    $('userLabel').textContent = `@${user.login}`;
    if (user.avatar) $('userAvatar').src = user.avatar;
    loadItems();
  }
  async function refreshSession() {
    try {
      const data = await api('/api/auth?action=me');
      if (data.authenticated) showDashboard(data);
    } catch (error) { message('loginMessage', error.message); }
  }
  $('githubLoginBtn').addEventListener('click', () => { window.location.href = '/api/auth?action=login'; });
  $('signOutBtn').addEventListener('click', async () => {
    try { await api('/api/auth?action=logout', { method: 'POST' }); } catch {}
    $('dashboardView').classList.add('hidden');
    $('loginView').classList.remove('hidden');
    $('signOutBtn').classList.add('hidden');
  });

  const params = new URLSearchParams(location.search);
  if (params.has('auth_error')) message('loginMessage', params.get('auth_error'));
  if (params.has('signed_in')) history.replaceState({}, '', location.pathname);

  $('categoryNav').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el === button));
    $('sectionTitle').textContent = labels[category][0];
    $('sectionDescription').textContent = labels[category][1];
    $('sectionEyebrow').textContent = `LIBRARY / ${category.replace('-', ' ').toUpperCase()}`;
    loadItems();
  });
  async function loadItems() {
    $('itemsList').innerHTML = '<div class="empty-state">Loading…</div>';
    try {
      const data = await api(`/api/cms?category=${encodeURIComponent(category)}`);
      const drafts = JSON.parse(localStorage.getItem(`180dcms-drafts:${category}`) || '[]');
      currentItems = [...(data.items || []), ...drafts.map(item => ({ ...item, _localDraft: true, published: false }))];
      renderItems();
    } catch (error) {
      $('itemsList').innerHTML = `<div class="empty-state">${escapeHTML(error.message)}</div>`;
    }
  }
  function renderItems() {
    const q = $('searchInput').value.trim().toLowerCase();
    const status = $('statusFilter').value;
    const items = currentItems.filter(item =>
      (!q || `${item.title} ${item.description}`.toLowerCase().includes(q)) &&
      (status === 'all' || (status === 'published' ? item.published : !item.published))
    );
    if (!items.length) {
      $('itemsList').innerHTML = '<div class="empty-state">Nothing here yet. Add your first item to get started.</div>';
      return;
    }
    $('itemsList').innerHTML = items.map(item => {
      const media = Array.isArray(item.media_urls) ? item.media_urls : [];
      const image = media.find(url => /\.(png|jpe?g|webp)(\?|$)/i.test(url));
      const thumb = image ? `<img src="${escapeHTML(image)}" alt="">` : (category === 'publications' ? '↗' : '✳');
      return `<article class="item-row"><div class="item-thumb">${thumb}</div><div class="item-info"><strong>${escapeHTML(item.title)}<span class="status ${item.published ? 'published' : 'draft'}">${item.published ? 'Published' : (item._localDraft ? 'Local draft' : 'Draft')}</span></strong><small>${escapeHTML(item.description || 'No description')} · Order ${Number(item.sort_order) || 0}</small></div><div class="item-actions"><button data-edit="${escapeHTML(item.id)}">Edit</button><button data-delete="${escapeHTML(item.id)}">Delete</button></div></article>`;
    }).join('');
  }
  $('searchInput').addEventListener('input', renderItems);
  $('statusFilter').addEventListener('change', renderItems);
  $('itemsList').addEventListener('click', async event => {
    const edit = event.target.closest('[data-edit]');
    const del = event.target.closest('[data-delete]');
    if (edit) openEditor(currentItems.find(item => item.id === edit.dataset.edit));
    if (del) {
      const item = currentItems.find(entry => entry.id === del.dataset.delete);
      if (!item || !confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
      try {
        if (item._localDraft) {
          const drafts = JSON.parse(localStorage.getItem(`180dcms-drafts:${category}`) || '[]').filter(entry => entry.id !== item.id);
          localStorage.setItem(`180dcms-drafts:${category}`, JSON.stringify(drafts));
          toast('Local draft deleted');
        } else {
          await api('/api/cms', { method: 'DELETE', body: JSON.stringify({ category, id: item.id }) });
          toast('Content deleted · GitHub commit created');
        }
        loadItems();
      } catch (error) { toast(error.message); }
    }
  });

  function openEditor(item = null) {
    $('contentForm').reset();
    $('itemId').value = item?.id || '';
    $('itemTitle').value = item?.title || '';
    $('itemDescription').value = item?.description || '';
    $('itemDate').value = item?.date || '';
    $('itemOrder').value = item?.sort_order ?? 0;
    $('itemLink').value = item?.link_url || '';
    $('itemPublished').checked = !!item?.published;
    currentMedia = Array.isArray(item?.media_urls) ? [...item.media_urls] : [];
    renderMedia();
    $('editorTitle').textContent = item ? 'Edit content' : 'Add content';
    $('editorMessage').textContent = '';
    $('editorModal').classList.remove('hidden');
    $('itemTitle').focus();
  }
  function renderMedia() {
    $('existingMedia').innerHTML = currentMedia.map((url, i) => `<span class="media-chip"><a href="${escapeHTML(url)}" target="_blank" rel="noopener">${escapeHTML(url.split('/').pop().slice(0, 34))}</a> <button type="button" data-remove-media="${i}" aria-label="Remove file">×</button></span>`).join('');
  }
  $('existingMedia').addEventListener('click', event => {
    const btn = event.target.closest('[data-remove-media]');
    if (!btn) return;
    currentMedia.splice(Number(btn.dataset.removeMedia), 1);
    renderMedia();
  });
  $('newItemBtn').addEventListener('click', () => openEditor());
  function closeEditor() { $('editorModal').classList.add('hidden'); }
  $('closeModal').addEventListener('click', closeEditor);
  $('cancelEdit').addEventListener('click', closeEditor);
  $('editorModal').addEventListener('click', event => { if (event.target === $('editorModal')) closeEditor(); });

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }
  $('contentForm').addEventListener('submit', async event => {
    event.preventDefault();
    const save = $('saveItemBtn');
    save.disabled = true;
    try {
      const files = [...$('itemFiles').files];
      const publishNow = $('itemPublished').checked;
      if (publishNow) {
        for (const file of files) {
          if (file.size > 3 * 1024 * 1024) throw new Error(`${file.name} exceeds the 3 MB limit. Compress it before uploading.`);
          message('editorMessage', `Uploading ${file.name} to the GitHub repository…`, false);
          const uploaded = await api('/api/cms', { method: 'POST', body: JSON.stringify({ action: 'upload', category, name: file.name, mime: file.type, data: await fileToBase64(file) }) });
          currentMedia.push(uploaded.url);
        }
      }
      const wasLocalDraft = currentItems.some(entry => entry.id === $('itemId').value && entry._localDraft);
      const item = {
        id: $('itemId').value || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
        title: $('itemTitle').value.trim(),
        description: $('itemDescription').value.trim(),
        date: $('itemDate').value || null,
        sort_order: Number($('itemOrder').value || 0),
        link_url: $('itemLink').value.trim(),
        media_urls: currentMedia,
        published: $('itemPublished').checked
      };
      const draftsKey = `180dcms-drafts:${category}`;
      const drafts = JSON.parse(localStorage.getItem(draftsKey) || '[]');
      if (!item.published) {
        localStorage.setItem(draftsKey, JSON.stringify([...drafts.filter(entry => entry.id !== item.id), item]));
        if ($('itemId').value && !wasLocalDraft) {
          message('editorMessage', 'Removing the live version and saving a private local draft…', false);
          await api('/api/cms', { method: 'POST', body: JSON.stringify({ action: 'unpublish', category, id: item.id }) });
        }
        closeEditor();
        toast(files.length ? 'Draft saved locally · files upload when published' : 'Draft saved in this browser only');
      } else {
        message('editorMessage', 'Saving content and creating GitHub commit…', false);
        await api('/api/cms', { method: 'POST', body: JSON.stringify({ action: 'save', category, item }) });
        localStorage.setItem(draftsKey, JSON.stringify(drafts.filter(entry => entry.id !== item.id)));
        closeEditor();
        toast('Published · GitHub commit created');
      }
      await loadItems();
    } catch (error) {
      message('editorMessage', error.message || 'Could not save content.');
    } finally {
      save.disabled = false;
    }
  });

  refreshSession();
})();
