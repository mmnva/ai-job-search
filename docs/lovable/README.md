# Lovable product brief — AI Job Search SaaS

**Source CLI:** [mmnva/ai-job-search](https://github.com/mmnva/ai-job-search)  
**App scaffold:** [`lovable-app/`](../../lovable-app/) → push to [mmnva/cursor-next-offer](https://github.com/mmnva/cursor-next-offer) (see [`NEW_REPO.md`](NEW_REPO.md))  
**Decisions locked:** full apply loop in v1; multi-tenant SaaS end-state; markdown→PDF (no LaTeX in v1); paste/URL job intake in v1; portal search planned (Phase B).

## Product one-liner

Authenticated users complete: profile → paste or URL job description → fit evaluation → tailored resume + cover letter (markdown) → review → PDF export → pipeline tracker.

## v1 screens

| Screen | Purpose |
|--------|---------|
| Auth | Supabase email magic link + Google OAuth |
| Onboarding / Profile | Identity, experience, skills, languages, dealbreakers, targets |
| New application | Paste JD or URL → server fetch → confirm text |
| Fit evaluation | Scorecard before drafting (go / no-go) |
| Draft studio | Resume + cover markdown editors + reviewer critique panel |
| Export | HTML/print CSS → PDF; store in private Storage |
| Pipeline | Status board/table + notes + charts |
| Settings | Quotas, data export/delete; portal search flag (disabled in v1) |

## Explicit v1 non-goals

- Live portal search (Phase B)
- Gmail / Notion sync
- Interview prep / upskill
- LaTeX compile loop
- `/add-portal` / `/add-template`
- Shared team workspaces (schema leaves room for `org_id`)

## Agent behavior sources (do not invent)

| Step | Excerpt / source |
|------|------------------|
| Untrusted posting | [`excerpts/untrusted-posting.md`](excerpts/untrusted-posting.md) from `.claude/commands/apply.md` |
| Fit scoring | [`excerpts/job-evaluation.md`](excerpts/job-evaluation.md) from `04-job-evaluation.md` |
| Writing style | [`excerpts/writing-style.md`](excerpts/writing-style.md) from `03-writing-style.md` |
| URL fetch | [`excerpts/web-research.md`](excerpts/web-research.md) from `09-web-research.md` |

Prompts for Edge Functions live under [`prompts/`](prompts/) and must stay aligned with those excerpts.

## Architecture

- **UI:** Lovable / Vite React (scaffold in `lovable-app/`)
- **Backend:** Supabase Auth, Postgres + RLS, Storage (private buckets), Edge Functions
- **LLM:** Server-side only (Edge Functions). Prototype may use Lovable AI gateway; production uses Anthropic or OpenAI API keys in secrets.
- **Cloud budget:** Lovable + Supabase first; Cloudflare if leaving Lovable hosting; avoid early AWS. See [`exit-path.md`](exit-path.md).

## Human gates

1. Show fit evaluation before allowing draft.
2. Show draft + review before export.
3. No silent tracker writes from speculative signals.

## Success criteria (v1)

- [ ] User A cannot read user B rows (RLS)
- [ ] No LLM API keys in client bundles
- [ ] Token usage logged on `agent_runs`
- [ ] Full path: profile → JD → fit → draft → review → PDF → pipeline
- [ ] Portal search behind feature flag, off by default
