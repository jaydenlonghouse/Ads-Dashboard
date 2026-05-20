# Longhouse Advertising Dashboard

React + Vite dashboard that aggregates digital advertising data from Airtable.

Hosted on **Vercel** with **Supabase Auth** (Google sign-in, `@longhouse.co` only). Airtable credentials stay on the server via `/api` routes.

## Features

- **Google login** — Supabase Auth, restricted to `@longhouse.co` Workspace accounts
- **Period-over-period KPIs** — Spend, CTR, Clicks, CPL, CPD, CPW with Δ% badges
- **Auto previous period** — equal-length window calculated automatically
- **Platform tabs** — All Platforms (combined), Google Ads, or Meta Ads; filtering is client-side
- **Trend chart** — Recharts multi-line with buckets inside the selected date range
- **Airtable rate-limit safe** — exponential backoff on 429, 5-min React Query cache, single full-dataset fetch per session
- **Demo mode** — `VITE_USE_MOCK=true` for mock data without auth (local UI dev)

## Quick Start

### Mock / UI only (no Supabase, no API)

```bash
npm install
cp .env.example .env
# Set VITE_USE_MOCK=true and VITE_DATA_EARLIEST_DATE
npm run dev
```

### Full stack locally (auth + Airtable proxy)

```bash
npm install
cp .env.example .env
# Fill client + server vars (see tables below)
npx vercel dev
```

`vercel dev` serves the Vite app and `/api/*` serverless routes together.

### Production deploy (Vercel)

1. Import the repo in [Vercel](https://vercel.com).
2. Set **Environment Variables** (Production + Preview): all client `VITE_*` and server `AIRTABLE_*`, `SUPABASE_*` vars from `.env.example`.
3. **Do not** set `VITE_AIRTABLE_PAT` in production — the PAT must only exist as `AIRTABLE_PAT` on the server.
4. Deploy; use the Vercel URL in Supabase redirect settings.

## Supabase + Google OAuth setup

1. Create a [Supabase](https://supabase.com) project.
2. **Authentication → Providers → Google**: enable; add OAuth client ID/secret from [Google Cloud Console](https://console.cloud.google.com/) (Web application).
3. **Authentication → URL configuration**:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**:
     - `http://localhost:5173/**` (or the port `vercel dev` prints)
     - `https://your-app.vercel.app/**`
     - `https://*.vercel.app/**` (optional, for preview deploys)
4. In Google Cloud OAuth client:
   - **Authorized JavaScript origins**: `http://localhost:5173`, `https://your-app.vercel.app`
   - **Authorized redirect URIs**: the Supabase callback URL shown in the Supabase Google provider settings (e.g. `https://YOUR_PROJECT.supabase.co/auth/v1/callback`)
5. Copy **Project URL** and **anon public** key into `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and the same into `SUPABASE_URL`, `SUPABASE_ANON_KEY` for API routes.

Sign-in uses `hd=longhouse.co` (Workspace hint) plus app and API checks that the email ends with `@longhouse.co`.

## Environment variables

### Client (`VITE_*` — bundled into the browser)

| Variable | Purpose |
|----------|---------|
| `VITE_USE_MOCK` | `true` = mock data, skip login |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `VITE_ALLOWED_EMAIL_DOMAIN` | Allowed email domain (default `longhouse.co`) |
| `VITE_QUESTION_EMAIL_TO` | Ask a Question Gmail recipient |
| `VITE_QUESTION_EMAIL_SUBJECT` | Ask a Question email subject |
| `VITE_DATA_EARLIEST_DATE` | First day with data (`YYYY-MM-DD`) |

### Server (Vercel / `vercel dev` only — never `VITE_`)

| Variable | Purpose |
|----------|---------|
| `AIRTABLE_PAT` | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Base ID from the Airtable URL |
| `AIRTABLE_TABLE_NAME` | Metrics table name |
| `AIRTABLE_DEALS_TABLE_NAME` | Deals table name |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` |
| `ALLOWED_EMAIL_DOMAIN` | Optional; default `longhouse.co` |

## Airtable Setup

1. Create a Personal Access Token at https://airtable.com/create/tokens
   - Scopes: `data.records:read`
   - Access: your base
2. Find your Base ID in the URL: `https://airtable.com/appXXXXXXXX/...`
3. Set `AIRTABLE_TABLE_NAME` and `AIRTABLE_DEALS_TABLE_NAME` to match your base

### Required Airtable Columns

| Column name     | Type         |
|-----------------|--------------|
| Date            | Date         |
| Platform        | Single select|
| Spend           | Currency     |
| Clicks          | Number       |
| Impressions     | Number       |
| Conversions     | Number       |
| Deals           | Number       |
| Closed Deals    | Number       |

Optional: **CTR** (Number or Percent) — used when totals cannot be derived from Clicks ÷ Impressions (see `kpiUtils.js`).

## Project Structure

```
api/
├── records.js              # GET metrics (auth + Airtable)
├── deals.js                # GET deals (auth + Airtable)
└── _lib/
    ├── verifyAuth.js       # Supabase JWT + @longhouse.co check
    └── airtable.js         # Server-side Airtable client
src/
├── contexts/AuthContext.jsx
├── components/AuthGate.jsx
├── pages/LoginPage.jsx
├── lib/
│   ├── apiClient.js        # Calls /api with Bearer token
│   └── supabaseClient.js
├── hooks/useDashboardData.js
└── App.jsx
```

## Build for Production

```bash
npm run build
# Output in dist/ — deploy via Vercel (recommended)
```

## Security notes

- Rotate the Airtable PAT if it was previously committed or shipped in a client bundle.
- The Supabase anon key is public by design; protection is JWT verification on `/api` routes and domain checks.
- Never set `VITE_AIRTABLE_PAT` on Vercel production.
