# AI Job Search US Cursor Fork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Personalize the safe mmnva/ai-job-search fork for a US Cursor-first workflow with scrape routing and bi-level-loop verification.

**Architecture:** Keep `.claude/` as the upstream source of truth. Add thin `.cursor/` adapters, disable DK portals by default, wire resume/interview skills, add a scrape-router skill, and verify with a locked `score.sh` bi-level loop.

**Tech Stack:** Claude Code specs, Bun portal CLIs, Cursor rules/skills, Firecrawl/Bright Data/Browse/Tavily plugins, Python security_guards + unittest.

## Global Constraints

- Do not delete `.claude/` or widen Bash allowlist without updating `tools/security_guards.py` + tests.
- US primary portals: LinkedIn + FreeHire; Danish portals `enabled: false`.
- Coach must never edit `loops/job-search-improve/score.sh` or truncate `attempts.log`.
- No live LinkedIn scraping in CI; typecheck only for portal CLIs in the locked score.
- Spec: `docs/superpowers/specs/2026-08-05-ai-job-search-fork-design.md`.

---

## File map

| Path | Responsibility |
|------|----------------|
| `.agents/skills/{jobbank,jobdanmark,jobindex,jobnet}-search/SKILL.md` | `enabled: false` for US default |
| `.claude/skills/job-scraper/search-queries.md` | US market notes + portal priority |
| `CLAUDE.md` | US market scaffolding + skill wiring notes |
| `AGENTS.md` | Cursor adapter pointer |
| `.cursor/rules/ai-job-search.mdc` | Always-on constraints |
| `.cursor/skills/{setup,scrape,rank,apply,interview,scrape-router}/SKILL.md` | Thin workflow mirrors |
| `loops/job-search-improve/*` | Bi-level loop artifacts |
| `tests/test_scrape_router_contract.py` | Locked score component for US scrape order |
| `SETUP_CURSOR.md` | Cursor vs Claude Code map |

---

### Task 1: US portal defaults

- [ ] Set `enabled: false` on four Danish portal SKILL.md frontmatter keys
- [ ] Add US priority section to `search-queries.md`
- [ ] Run `python3 tools/security_guards.py` → expect OK

### Task 2: Profile + skill wiring docs

- [ ] Update `CLAUDE.md` Workflow to prefer `resume-tailoring` when markdown resumes exist; interview via `interview-prep`
- [ ] Set CV language / country placeholders toward United States / English without inventing personal bio facts
- [ ] Update `AGENTS.md` with `.cursor/` thin-pointer note

### Task 3: Cursor rule + five workflow skills

- [ ] Create `.cursor/rules/ai-job-search.mdc`
- [ ] Create `.cursor/skills/{setup,scrape,rank,apply,interview}/SKILL.md` pointing at `.claude/`
- [ ] Create `SETUP_CURSOR.md` command map

### Task 4: Scrape router

- [ ] Create `.cursor/skills/scrape-router/SKILL.md` with Bun → Firecrawl/Bright Data → Browse order
- [ ] Add `tests/test_scrape_router_contract.py` asserting US portal enablement + router doc markers
- [ ] Run the new test → expect pass

### Task 5: Bi-level loop

- [ ] Create `loops/job-search-improve/{playbook.md,WORKER.md,COACH.md,score.sh}`
- [ ] Gitignore `loops/job-search-improve/attempts.log`
- [ ] Run `./loops/job-search-improve/score.sh` for baseline; append baseline line to attempts.log

### Task 6: Verify

- [ ] `security_guards.py` OK
- [ ] `python3 -m unittest tests.test_scrape_router_contract` (and broader suite if fast)
- [ ] LinkedIn + FreeHire `bun run typecheck`
- [ ] Commit implementation

---
