# Separate GitHub repo instructions

The cloud agent token cannot call `createRepository` (HTTP 403). Create the app repo manually:

```bash
# On a machine with a PAT that can create repos under mmnva:
gh repo create mmnva/ai-job-search-app --public \
  --description "Lovable + Supabase SaaS port of ai-job-search"

# From this clone:
cd lovable-app
git init
git add .
git commit -m "feat: initial Lovable SaaS scaffold for AI job search"
git branch -M main
git remote add origin https://github.com/mmnva/ai-job-search-app.git
git push -u origin main
```

Then in Lovable: import/sync that GitHub repo and connect Supabase. Apply [`schema.sql`](schema.sql) (also copied to `lovable-app/supabase/migrations/`).
