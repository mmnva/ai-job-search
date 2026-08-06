# AI Job Search Fork — Design Spec

**Date:** 2026-08-05  
**Repo:** [mmnva/ai-job-search](https://github.com/mmnva/ai-job-search) (fork of MadsLorentzen/ai-job-search)  
**Approach:** Phased fork-first (approved)

## Safety verdict

Upstream content is **SAFE** to install and run locally: no malicious package lifecycle scripts, no committed secrets, network calls limited to known job boards, `tools/security_guards.py` enforced in CI. Residual risks are normal for an agentic job-search tool (LLM prompt injection from postings, Anthropic/Claude usage, optional MCP OAuth).

After populate, `python3 tools/security_guards.py` must pass before further work. Failure → stop.

## Goals

1. **A — Personalize (US):** US-first portal defaults; profile scaffolding; wire `resume-tailoring` and `interview-prep`.
2. **B — Cursor-native:** Thin Cursor mirrors of Claude Code slash workflows; `.claude/` remains upstream source of truth.
3. **C — Harden:** Scrape router (Bun CLIs → Firecrawl/Bright Data → Browse); `code-architect` + `improve-codebase-architecture`.
4. **D — Bi-level loop testing:** Worker/coach with locked verifier score.

## Non-goals

- Deleting or rewriting `.claude/` as Cursor-only
- Installing low-install competing job-search/scrape skills from skills.sh
- Coach changing what counts as success
- Live LinkedIn/ToS-risky scraping in CI

## Architecture

```
.claude/                    # Upstream source of truth (commands + skill specs)
.agents/skills/*/cli        # Bun portal CLIs (LinkedIn, FreeHire primary for US)
.cursor/rules/              # Always-on Cursor constraints
.cursor/skills/             # Thin adapters → .claude/skills + local skills
loops/job-search-improve/   # Bi-level loop (playbook, score, worker, coach)
```

### Scrape router order (US)

1. Enabled Bun portal CLIs (`linkedin-search`, `freehire-search` first; DK portals disabled by default)
2. Firecrawl / Bright Data for generic career-page / JD URLs
3. Browse browser-automation only when interaction is required

Do not widen `.claude/settings.json` Bash allowlist without updating `tools/security_guards.py` and tests.

### Skill wiring

| Workflow | Primary skill | Notes |
|----------|---------------|-------|
| Apply / CV | `resume-tailoring` (user) then LaTeX path | Prefer markdown library when present |
| Interview | `interview-prep` + Tavily research | Orchestrated via Cursor `/interview` mirror |
| Scrape fallback | Firecrawl, Bright Data, Browse | After Bun CLI failure or non-portal URL |

## Bi-level loop testing

Worker proposes one measurable change; runs locked `score.sh` (0–100); appends to `attempts.log`. Coach every 20 attempts rewrites `playbook.md` only — never scoring. Categories: `install`, `security`, `cursor-mirror`, `us-defaults`, `scrape-router`, `resume-wire`, `interview-wire`, `portal-cli`, `docs`.

| Points | Check |
|--------|--------|
| 25 | `security_guards.py` |
| 25 | Python unit tests |
| 20 | LinkedIn + FreeHire typecheck |
| 15 | Cursor rule + five workflow skill stubs |
| 15 | Scrape-router US order contract |

Stop: best ≥ 90 for 2 coach cycles, or 3 coach cycles with no gain, or 60 worker attempts.

## Phases

0. Populate fork + `bun install` + security_guards  
1. Confirm plugins/skills (agent-development; Firecrawl; Bright Data; Browse; Tavily; improve-codebase-architecture)  
2. US personalization + skill wiring  
3. Cursor mirrors  
4. Architect + scrape router  
5. Bi-level loop artifacts + baseline score  

## Skills inventory (as of design)

**Install:** `anthropics/claude-code@Agent Development` → `~/.agents/skills/agent-development`  
**Skip:** low-install job-search/scrape packs from skills.sh  
**Already present:** Firecrawl, Bright Data, Browse, Apify, Tavily, `improve-codebase-architecture`, `resume-tailoring`, `interview-prep`
