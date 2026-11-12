const crypto = require('node:crypto');
const { COOKIE_NAME, STATE_COOKIE, SESSION_TTL, parseCookies, cookie, clearCookie, seal, getSession, allowedUsers, sendJson } = require('../lib/cms-server');

module.exports = async function handler(req, res) {
  const action = req.query?.action || new URL(req.url, `https://${req.headers.host}`).searchParams.get('action');
  const base = (process.env.APP_URL || `https://${req.headers.host}`).replace(/\/$/, '');
  try {
    if (action === 'login') {
      if (!process.env.GITHUB_CLIENT_ID) throw new Error('GITHUB_CLIENT_ID is missing in Vercel environment variables.');
      if (!allowedUsers().length) throw new Error('GITHUB_ALLOWED_USERS is empty. Add at least one approved GitHub username.');
      const state = crypto.randomBytes(24).toString('hex');
      const scope = process.env.GITHUB_PRIVATE_REPO === 'true' ? 'repo' : 'public_repo';
      const redirect = `${base}/api/auth?action=callback`;
      res.setHeader('Set-Cookie', cookie(STATE_COOKIE, state, 600));
      res.statusCode = 302;
      res.setHeader('Location', `https://github.com/login/oauth/authorize?${new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: redirect, scope, state })}`);
      return res.end();
    }
    if (action === 'callback') {
      const query = new URL(req.url, `https://${req.headers.host}`).searchParams;
      const stateCookie = parseCookies(req)[STATE_COOKIE];
      if (!stateCookie || !query.get('state') || stateCookie !== query.get('state')) throw new Error('GitHub sign-in could not be verified. Please try again.');
      if (query.get('error')) throw new Error('GitHub sign-in was cancelled or denied.');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: query.get('code'), redirect_uri: `${base}/api/auth?action=callback` })
      });
      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Could not complete GitHub sign-in.');
      const userResponse = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' } });
      const user = await userResponse.json();
      if (!userResponse.ok || !allowedUsers().includes(String(user.login || '').toLowerCase())) throw new Error(`GitHub account @${user.login || 'unknown'} is not authorised for this CMS.`);
      const session = seal({ token: tokenData.access_token, login: user.login, avatar: user.avatar_url, exp: Date.now() + SESSION_TTL * 1000 });
      res.setHeader('Set-Cookie', [cookie(COOKIE_NAME, session, SESSION_TTL), clearCookie(STATE_COOKIE)]);
      res.statusCode = 302; res.setHeader('Location', `${base}/admin/?signed_in=1`); return res.end();
    }
    if (action === 'logout') {
      res.setHeader('Set-Cookie', clearCookie(COOKIE_NAME));
      return sendJson(res, 200, { ok: true });
    }
    if (action === 'me') {
      const session = getSession(req);
      if (!session) return sendJson(res, 401, { authenticated: false });
      return sendJson(res, 200, { authenticated: true, login: session.login, avatar: session.avatar });
    }
    return sendJson(res, 404, { error: 'Unknown authentication action.' });
  } catch (error) {
    res.setHeader('Set-Cookie', clearCookie(STATE_COOKIE));
    res.statusCode = 302; res.setHeader('Location', `${base}/admin/?auth_error=${encodeURIComponent(error.message)}`); return res.end();
  }
};
