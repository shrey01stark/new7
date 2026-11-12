const crypto = require('node:crypto');
const { CATEGORIES, requireSession, readRepoFile, writeRepoFile, sendJson, repoConfig } = require('../lib/cms-server');

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
function validCategory(value) { return CATEGORIES.has(value); }
async function getItems(token, category) {
  const file = await readRepoFile(token, `content/${category}.json`);
  if (!file.text) return { items: [], sha: null };
  let items;
  try { items = JSON.parse(file.text); } catch { throw new Error(`content/${category}.json is not valid JSON. Fix it in GitHub before continuing.`); }
  if (!Array.isArray(items)) throw new Error(`content/${category}.json must contain a JSON array.`);
  return { items, sha: file.sha };
}
module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const expectedOrigin = new URL(process.env.APP_URL || `https://${req.headers.host}`).origin;
  if (origin && origin !== expectedOrigin) return sendJson(res, 403, { error: 'Cross-origin requests are not allowed.' });
  const session = requireSession(req, res);
  if (!session) return;
  try {
    if (req.method === 'GET') {
      const category = req.query?.category;
      if (!validCategory(category)) return sendJson(res, 400, { error: 'Choose a valid content category.' });
      const { items } = await getItems(session.token, category);
      return sendJson(res, 200, { items: items.filter(item => item.published === true) });
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const category = body.category;
      if (!validCategory(category)) return sendJson(res, 400, { error: 'Choose a valid content category.' });
      if (body.action === 'upload') {
        const fileName = String(body.name || 'upload').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 100);
        const mime = String(body.mime || 'application/octet-stream');
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowed.includes(mime)) return sendJson(res, 415, { error: 'Only JPG, PNG, WebP and PDF files are supported.' });
        const raw = Buffer.from(String(body.data || ''), 'base64');
        if (!raw.length || raw.length > MAX_UPLOAD_BYTES) return sendJson(res, 413, { error: 'Each upload must be between 1 byte and 3 MB.' });
        const path = `uploads/cms/${category}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${fileName}`;
        const result = await writeRepoFile(session.token, path, raw, `CMS: upload ${fileName}`);
        const { repo, branch } = repoConfig();
        return sendJson(res, 200, { path, url: `/${path}`, commit: result.commit?.sha, rawUrl: `https://raw.githubusercontent.com/${repo}/${branch}/${path}` });
      }
      if (body.action === 'save') {
        if (body.item?.published !== true) return sendJson(res, 400, { error: 'Only published content can be committed. Drafts are kept privately in the admin browser.' });
        const title = String(body.item?.title || '').trim();
        if (!title || title.length > 140) return sendJson(res, 400, { error: 'Title is required and must be 140 characters or fewer.' });
        const { items, sha } = await getItems(session.token, category);
        const existing = body.item.id ? items.findIndex(item => item.id === body.item.id) : -1;
        const linkUrl = String(body.item.link_url || '').trim();
        if (linkUrl && !/^https?:\/\//i.test(linkUrl)) return sendJson(res, 400, { error: 'Links must start with https:// or http://.' });
        const item = {
          id: existing >= 0 ? items[existing].id : (body.item.id || crypto.randomUUID()),
          title,
          description: String(body.item.description || '').slice(0, 1200),
          date: body.item.date || null,
          sort_order: Number.isFinite(Number(body.item.sort_order)) ? Number(body.item.sort_order) : 0,
          link_url: linkUrl,
          media_urls: Array.isArray(body.item.media_urls) ? body.item.media_urls.filter(v => typeof v === 'string' && v.startsWith('/uploads/cms/')) : [],
          published: Boolean(body.item.published),
          updated_at: new Date().toISOString(),
          ...(existing >= 0 ? { created_at: items[existing].created_at || new Date().toISOString() } : { created_at: new Date().toISOString() })
        };
        if (existing >= 0) items[existing] = item; else items.push(item);
        const result = await writeRepoFile(session.token, `content/${category}.json`, JSON.stringify(items, null, 2) + '\n', `CMS: ${existing >= 0 ? 'update' : 'add'} ${title}`, sha);
        return sendJson(res, 200, { item, commit: result.commit?.sha });
      }
      if (body.action === 'unpublish') {
        const id = body.id;
        if (!id) return sendJson(res, 400, { error: 'Item ID is required.' });
        const { items, sha } = await getItems(session.token, category);
        const next = items.filter(item => item.id !== id);
        if (next.length === items.length) return sendJson(res, 404, { error: 'Published item not found.' });
        const result = await writeRepoFile(session.token, `content/${category}.json`, JSON.stringify(next, null, 2) + '\n', 'CMS: unpublish content item', sha);
        return sendJson(res, 200, { ok: true, commit: result.commit?.sha });
      }
      return sendJson(res, 400, { error: 'Unknown CMS action.' });
    }
    if (req.method === 'DELETE') {
      const { category, id } = req.body || {};
      if (!validCategory(category) || !id) return sendJson(res, 400, { error: 'Category and item ID are required.' });
      const { items, sha } = await getItems(session.token, category);
      const next = items.filter(item => item.id !== id);
      if (next.length === items.length) return sendJson(res, 404, { error: 'Content item not found.' });
      const result = await writeRepoFile(session.token, `content/${category}.json`, JSON.stringify(next, null, 2) + '\n', 'CMS: delete content item', sha);
      return sendJson(res, 200, { ok: true, commit: result.commit?.sha });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message || 'CMS request failed.' });
  }
};
