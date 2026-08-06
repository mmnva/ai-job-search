# Screens and user flows (v1)

## Happy path

```
Auth → Onboarding Profile → New Application (paste|URL)
  → Fit Evaluation (gate) → Draft Studio → Review panel
  → Export PDF → Pipeline (status Active)
```

## Screen details

### Auth
- Magic link email and Google OAuth via Supabase Auth.
- After login: if `profiles.onboarding_complete = false` → Onboarding; else Pipeline.

### Onboarding / Profile
Fields mapped from CLI setup concepts (not a dump of CLAUDE.md placeholders):
- Name, location, country, languages (array of {language, level})
- Headline, employment status
- Experience entries (title, company, dates, bullets)
- Primary/secondary skills, dealbreakers, target roles/sectors
- Save → `profiles.onboarding_complete = true`

### New application
1. Choose Paste or URL.
2. URL path: call Edge Function `fetch-jd` with user-supplied URL only.
3. Show extracted `raw_text`; user edits/confirms.
4. Insert `jobs` row; optionally create `applications` stub with status `active`.

### Fit evaluation
1. Call `evaluate-job` with profile + job text.
2. Persist `evaluations` + `agent_runs` (token_usage).
3. UI: scores, gaps, recommendation.
4. **Gate:** Draft disabled if recommendation is hard-fail (eligibility/language FAIL from rubric) unless user overrides with acknowledgment.

### Draft studio
1. Call `draft-application` → resume + cover markdown.
2. Call `review-application` → critique JSON + narrative.
3. Editors for both docs; version bump on save.
4. Export: render print stylesheet → PDF download; upload to Storage `exports/`; set `documents.pdf_path`.

### Pipeline
- Table/kanban of `applications` joined to `jobs`.
- Filters: status, company search.
- Charts: counts by status (html-report analogue).

### Settings
- Plan / remaining applies this month (`usage_quotas`).
- Export my data / delete account.
- Portal search toggle **read-only** until Phase B + flag enabled.

## Phase B hook (not v1 UI requirement)
- Search page stub behind `feature_flags.portal_search`.
- Results → “Start apply” creates `jobs` with `ingest_channel = portal`.
