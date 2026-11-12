const crypto = require('node:crypto');

const COOKIE_NAME = '180dcms_session';
const STATE_COOKIE = '180dcms_oauth_state';
const SESSION_TTL = 7 * 24 * 60 * 60;
const CATEGORIES = new Set(['publications', 'events', 'clients', 'team', 'initiatives', 'site-updates']);

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}
function cookie(name, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
function clearCookie(name) { return cookie(name, '', 0); }
function secretKey() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.');
  return crypto.createHash('sha256').update(process.env.SESSION_SECRET).digest();
}
function seal(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
function unseal(value) {
  try {
    const raw = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString());
  } catch { return null; }
}
function getSession(req) {
  const value = parseCookies(req)[COOKIE_NAME];
  const session = value ? unseal(value) : null;
  if (!session || !session.token || !session.exp || session.exp < Date.now()) return null;
  return session;
}
function allowedUsers() {
  return (process.env.GITHUB_ALLOWED_USERS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
}
function repoConfig() {
  const repo = process.env.GITHUB_REPO || '180dcarsd/website';
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error('GITHUB_REPO must look like owner/repository.');
  return { repo, branch };
}
async function github(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `GitHub request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}
async function readRepoFile(token, path) {
  const { repo, branch } = repoConfig();
  try {
    const data = await github(token, `/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`);
    return { sha: data.sha, text: Buffer.from(data.content || '', 'base64').toString('utf8') };
  } catch (error) {
    if (error.status === 404) return { sha: null, text: null };
    throw error;
  }
}
async function writeRepoFile(token, path, content, message, sha = null) {
  const { repo, branch } = repoConfig();
  const body = { message, content: Buffer.from(content).toString('base64'), branch };
  if (sha) body.sha = sha;
  return github(token, `/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', body: JSON.stringify(body) });
}
function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function requireSession(req, res) {
  const session = getSession(req);
  if (!session) sendJson(res, 401, { error: 'Your session has expired. Sign in again.' });
  return session;
}
module.exports = { COOKIE_NAME, STATE_COOKIE, SESSION_TTL, CATEGORIES, parseCookies, cookie, clearCookie, seal, getSession, allowedUsers, repoConfig, github, readRepoFile, writeRepoFile, sendJson, requireSession };
