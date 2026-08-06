# Cursor setup for this fork

Canonical Claude Code commands live under `.claude/commands/`. This fork adds thin Cursor skills under `.cursor/skills/`.

| Intent | Claude Code | Cursor skill |
|--------|-------------|--------------|
| Onboard profile | `/setup` | `setup` |
| Find jobs | `/scrape` | `scrape` (+ `scrape-router` on fallback) |
| Score fit | `/rank` | `rank` |
| Tailor application | `/apply` | `apply` (prefers `resume-tailoring` when available) |
| Interview prep | `/interview` | `interview` (prefers `interview-prep` when JD URL + interviewer given) |

## Prerequisites

- Python 3.10+, Bun, optional LaTeX/`pdftotext` (see `SETUP.md`)
- Portal CLIs: `bun install` in each `.agents/skills/*/cli`
- Cursor plugins recommended: Firecrawl, Bright Data, Browse, Tavily

## US defaults

LinkedIn + FreeHire enabled; Danish demo portals disabled. Re-enable by setting `enabled: true` in the portal `SKILL.md`.

## Security

Run `python3 tools/security_guards.py` after changing permissions or package manifests. Do not commit personal CVs, trackers, or salary data.
