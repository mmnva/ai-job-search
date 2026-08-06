# Separate GitHub repo: `cursor-next-offer`

Target: **https://github.com/mmnva/cursor-next-offer**

Cloud agents only see repos the **Cursor GitHub App** can access. This agent can push to `ai-job-search` but gets `Repository not found` for `cursor-next-offer`. **You do not need to fix that** — push from your laptop instead.

## Recommended: push from your machine (no GitHub App)

You already own the empty repo. On any machine where `gh auth login` / git works for your account:

```bash
# Clone this fork (or pull latest master / PR #3)
git clone https://github.com/mmnva/ai-job-search.git
cd ai-job-search
git checkout cursor/wire-next-offer-260f   # or master once PR #3 merges

cd lovable-app
git init -b main
git add .
git commit -m "feat: initial Lovable SaaS scaffold (Next Offer)"
git remote add origin https://github.com/mmnva/cursor-next-offer.git
git push -u origin main
```

If `main` already has a README commit on GitHub:

```bash
git push -u origin main --force
# only OK on a brand-new empty app repo
```

Confirm in the browser: https://github.com/mmnva/cursor-next-offer should show `package.json`, `src/`, `supabase/`.

## Optional: Cursor GitHub App (only if you want agents to push)

Skip this unless you want cloud agents to write to `cursor-next-offer`.

1. Open https://github.com/settings/installations  
2. Click **Cursor** (or “Configure” next to it).  
3. Under **Repository access**, either:
   - **All repositories**, or  
   - **Only select repositories** → add **`cursor-next-offer`**.  
4. Save.

If Cursor is installed on an **org** (`mmnva` org): use the org’s **Settings → GitHub Apps**, not your personal settings.

Personal → Installed GitHub Apps: https://github.com/settings/installations  
Org example: `https://github.com/organizations/ORG/settings/installations`

## Then in Lovable (desktop Cursor)

1. Lovable MCP: Settings → Tools & MCP → confirm Lovable shows connected (cloud agents do **not** inherit that session).
2. In Lovable UI: import / sync **`mmnva/cursor-next-offer`**.
3. Connect Supabase; apply `supabase/migrations/`.
4. Set LLM secrets on Edge Functions.

## Keep forks separate

Do **not** overwrite `mmnva/ai-job-search` with the web app. Agent skills stay there; SaaS UI lives in `cursor-next-offer`.
