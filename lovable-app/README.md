# AI Job Search App (Lovable / Supabase scaffold)

Web SaaS port of the agent-native [ai-job-search](https://github.com/mmnva/ai-job-search) CLI apply loop.

## Stack

- Vite + React + TypeScript
- Supabase Auth, Postgres (RLS), Storage, Edge Functions
- Markdown drafts → print/PDF export (no LaTeX in v1)

## Setup

1. Create a Supabase project; copy URL + anon key into `.env` (see `.env.example`).
2. Run SQL in `supabase/migrations/20260806120000_init.sql`.
3. Create private Storage buckets `resumes` and `exports`.
4. Deploy Edge Functions under `supabase/functions/` and set secrets:
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (functions only)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (when enabling billing)
5. `npm install && npm run dev`

## Lovable

Import this folder as its own GitHub repo (`mmnva/ai-job-search-app` — create manually if the agent cannot). Connect Lovable ↔ GitHub ↔ Supabase. Prefer prompting Lovable with `docs/` briefs rather than inventing career logic.

## Feature flags

`feature_flags.portal_search` defaults to `false`. FreeHire search is implemented in `portal-search` but returns 403 until the flag is on.
