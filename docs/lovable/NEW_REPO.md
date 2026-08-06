# Separate GitHub repo: `cursor-next-offer`

Target app repo: **https://github.com/mmnva/cursor-next-offer**

The cloud agent token only sees repos the Cursor GitHub App can access. Today it can push to `mmnva/ai-job-search` but **not** `cursor-next-offer` (`Repository not found` / no listing). Until access is granted, push from a machine with your PAT, or grant the app access and re-run the agent.

## One-time: grant Cursor access (if private)

1. GitHub → **Settings → Applications → Installed GitHub Apps → Cursor** (or the org install under `mmnva`).
2. Repository access → include **`cursor-next-offer`** (or “All repositories”).
3. Confirm the repo exists at `https://github.com/mmnva/cursor-next-offer` (empty or with a README is fine).

## Push the scaffold (your machine or after access)

From the `ai-job-search` clone that already has `lovable-app/`:

```bash
cd lovable-app
git init -b main   # skip if already a git repo
git add .
git commit -m "feat: initial Lovable SaaS scaffold (Next Offer)"
git remote add origin https://github.com/mmnva/cursor-next-offer.git
# or: git remote set-url origin https://github.com/mmnva/cursor-next-offer.git
git push -u origin main
```

Or subtree from the monorepo root:

```bash
git subtree split --prefix=lovable-app -b next-offer-split
git push https://github.com/mmnva/cursor-next-offer.git next-offer-split:main
```

## Then in Lovable

1. **Cursor Settings → Tools & MCP → Connect** next to Lovable (`.cursor/mcp.json` alone is not enough; OAuth must complete).
2. Import / sync **`mmnva/cursor-next-offer`**.
3. Connect Supabase; apply migrations under `supabase/migrations/` (or `docs/lovable/schema.sql` in this fork).
4. Set secrets: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, Stripe keys when billing is on.

## Keep this fork separate

Do **not** overwrite `mmnva/ai-job-search` with the web app. Agent skills stay here; the SaaS UI lives in `cursor-next-offer`.
