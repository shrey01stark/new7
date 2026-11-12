# Website redevelopment notes

## Baseline
- Existing static HTML/CSS/JavaScript website and original assets retained.
- Main pages: Home, About, Clients, Contact, Events, Initiatives and R&D.
- Vercel deployment model; no build step required.

## Shared frontend hardening
- Added guards around shared JavaScript code that runs on pages without all homepage-only elements.
- Preserved original styles, animations and assets; did not remove uncertain dependencies merely because they looked unused.

## GitHub-backed CMS
- Admin UI: `admin/`
- Serverless API: `api/auth.js`, `api/cms.js`
- Shared server helpers: `api/_lib.js`
- Public content data: `content/*.json`
- Uploaded media: `uploads/cms/<category>/`
- Public content renderer: `assets/cms-public.js`
- Setup guide: `CMS-SETUP.md`

## Security model
- GitHub OAuth login, allowlisted usernames and encrypted HttpOnly session cookie.
- OAuth client secret and session secret live only in Vercel environment variables.
- Server API restricts content categories and accepted upload MIME types.
- No service-role key, Supabase client, database or external object-storage credentials.

## Limitations / validation still required
- Each content change commits to GitHub and triggers a Vercel deployment; the published site updates after deployment completes.
- Media uploads are capped at 3 MB per file due to serverless request limits.
- Existing hardcoded content remains; CMS content appears in the added CMS sections.
- A live OAuth round-trip, Vercel deployment, production visual regression and end-to-end content publish test require the owner's GitHub/Vercel configuration and cannot be completed from this local ZIP alone.

## Local verification performed for the GitHub CMS revision
- Node syntax checks passed for all project JavaScript files and serverless functions.
- Session encryption/decryption and category allowlist smoke tests passed.
- Mocked authenticated CMS read and GitHub content-write smoke test passed.
- HTML parser smoke test and admin local asset-reference check passed.
- Confirmed no Supabase runtime, configuration, client script or schema remains.
- Live GitHub OAuth, real repository permissions, Vercel deployment and visual regression still require owner-side setup and testing.
