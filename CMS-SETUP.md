# 180DC ARSD CMS — GitHub-only setup

The admin dashboard at `/admin/` uses GitHub OAuth and the GitHub repository as its content store. **No Supabase, database, storage bucket, CMS subscription or separate admin password is required.**

## How it works

- Admins sign in with their existing GitHub accounts.
- Only GitHub usernames listed in `GITHUB_ALLOWED_USERS` can access the dashboard.
- Content is stored as JSON in `content/` and uploaded files in `uploads/cms/`.
- Every edit creates a normal Git commit. GitHub history is the audit trail and rollback mechanism.
- Vercel automatically deploys commits to the configured production branch. Drafts are stored but are not rendered publicly.
- Public pages read the published JSON files from the deployed website.

## One-time setup (owner, approximately 10–15 minutes)

### 1. Confirm the repository

The default is `180dcarsd/website`, branch `main`. If the real repository or production branch differs, change `GITHUB_REPO` / `GITHUB_BRANCH` in Vercel environment variables. The GitHub OAuth app must be authorised to write to that repository.

### 2. Create a GitHub OAuth App

While signed in to the GitHub account that owns or administers the repository:

1. Open GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Application name: `180DC ARSD Website CMS`.
3. Homepage URL: `https://www.180dcarsd.org`.
4. Authorization callback URL: `https://www.180dcarsd.org/api/auth?action=callback`.
5. Register the application and copy its **Client ID**; generate a **Client secret**.

If testing on a Vercel preview URL, create a separate OAuth app for that preview and use its exact callback URL. Do not put the client secret in frontend files or GitHub.

### 3. Add Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `GITHUB_CLIENT_ID` | OAuth app Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth app Client secret |
| `GITHUB_ALLOWED_USERS` | Approved GitHub usernames, comma-separated, e.g. `username1,username2` |
| `GITHUB_REPO` | `180dcarsd/website` |
| `GITHUB_BRANCH` | `main` |
| `SESSION_SECRET` | A random secret of at least 32 characters |
| `APP_URL` | `https://www.180dcarsd.org` |

Generate `SESSION_SECRET` locally with Python:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

For a public repository, the OAuth app requests `public_repo` access. If the repository is private, add `GITHUB_PRIVATE_REPO=true`; the app will request the broader `repo` scope. Only use the private-repository setting if needed.

Set the variables for Production (and Preview if you have a separate preview OAuth app). Then redeploy the Vercel project.

### 4. Test

1. Open `https://www.180dcarsd.org/admin/`.
2. Select **Continue with GitHub**.
3. Sign in using a username included in `GITHUB_ALLOWED_USERS`.
4. Create a test draft, then publish a test item.
5. Check the resulting GitHub commit, Vercel deployment and public page.
6. Delete the test item from the dashboard when finished.

## Admin workflow

- **Draft:** save with “Publish this content” unchecked. Text and metadata stay in this browser only; they are not committed to the public repository. Drafts do not sync between admins or devices.
- **Publish:** check “Publish this content” and save. Vercel deploys the updated content automatically.
- **Ordering:** lower display-order numbers appear first.
- **Media:** JPG, PNG, WebP and PDF files are committed under `uploads/cms/<category>/` when you publish. Files selected while saving a draft are not uploaded; select them again when publishing. Current upload limit is 3 MB per file to stay within serverless request limits. Compress larger PDFs/images before upload.
- **Rollback:** use GitHub commit history to revert an accidental content or media change.

## Important operational notes

- This CMS is intentionally GitHub-backed and static-first. Each content save creates a GitHub commit and triggers a Vercel deployment; publishing is not instantaneous and follows the deployment time.
- Keep the Vercel project connected to the same repository and production branch configured above. The Vercel project root should be the repository root; no build command or output directory is needed.
- The GitHub OAuth app client secret and `SESSION_SECRET` are server-side Vercel variables only. Never commit them.
- Keep `GITHUB_ALLOWED_USERS` restrictive. Removing a username blocks future sign-ins; redeploy after changing environment variables.
- The API encrypts the GitHub access token in an HttpOnly, Secure (production), SameSite=Lax session cookie. The browser never receives the token in JavaScript.
- The admin API only accepts the configured categories and media upload types. It does not expose arbitrary repository file writes.
- Existing hardcoded site content is retained. CMS entries are appended in the dedicated CMS sections; this release does not yet migrate every existing hardcoded team/client/event card, footer detail or general page paragraph into editable content.
- The site can continue to work if the admin API is not configured; only `/admin/` sign-in and CMS operations require the Vercel environment variables.
