# 180 Degrees Consulting ARSD Website

Official website for 180 Degrees Consulting ARSD.

## Tech stack
- Static HTML, CSS and JavaScript frontend
- Vercel serverless API for the admin authentication and CMS write operations
- GitHub OAuth for administrator sign-in
- GitHub repository JSON files and `uploads/cms/` as the content/media store

## Deployment
- Hosting: Vercel
- Production branch: `main`
- Staging branch: `develop`
- Repository default: `180dcarsd/website`

The website requires no frontend build command or output directory. Vercel serves the static pages and runs the functions in `api/`.

## Admin CMS
Open `/admin/`. Administrators sign in using approved GitHub usernames. Content is committed to `content/`; media is committed to `uploads/cms/`. There is no Supabase or separate database/storage service. See [CMS-SETUP.md](./CMS-SETUP.md) for the one-time GitHub OAuth and Vercel environment setup.

## Social links
- Instagram: https://www.instagram.com/180dc.arsd/
- LinkedIn: https://www.linkedin.com/company/180-degrees-consulting-atma-ram-sanatan-dharma-college/
