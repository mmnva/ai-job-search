# Exit path: leave Lovable hosting

When the SaaS outgrows Lovable-managed hosting, use the verified **loveable-container** playbook (Cursor skill `loveable-container` / `lovable-containerize`).

## When to exit

- Need custom domains / Docker / non-Lovable CI
- Need to swap Lovable AI gateway for direct Anthropic/OpenAI (required: `LOVABLE_API_KEY` cannot be exfiltrated)
- Need private asset hosting without Lovable R2 shims

## Preferred post-Lovable cloud (startup budget)

1. **Stay on Supabase** for Auth/DB/Storage/Edge Functions (or migrate Edge Functions carefully).
2. **Front-end host:** Cloudflare Pages/Workers (or keep Lovable publish until forced to leave).
3. **Avoid early AWS** unless you add LaTeX workers or VPC requirements later.

## Playbook summary (do not skip the skill file)

Probe for Lovable export markers (`@lovable.dev/*`, `.lovable/project.json`, `ai.gateway.lovable.dev`, `*.asset.json`).

Then in order:

1. Env hygiene (`.env.example`, never commit secrets)
2. Health routes
3. Swap AI gateway → `@ai-sdk/google` or Anthropic provider with real API key
4. Swap Lovable email/webhooks → Resend + svix if used
5. Rescue R2 assets from `.asset.json` shims
6. Dockerfile + Node `serve.mjs` adapter (Workers-shape handler does not bind a port alone)
7. CI with Bun version pinned to lockfile
8. Probe container health + static assets MIME types

Full detail: local skill at `~/.claude/skills/loveable-container/` (or Cursor plugin cache equivalent).

## This monorepo

- CLI/agent reference remains `ai-job-search`.
- Web app home repo is **`mmnva/cursor-next-offer`**. Keep `ai-job-search` as the agent/CLI fork; do not overwrite it.
