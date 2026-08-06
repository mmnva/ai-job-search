---
framework_version: 1.0.0
---

# Agent Guidelines: AI Job Search

This workspace is structured to manage job search activities, scraper tools, CVs, cover letters, and interview preparation.

## Thin-Pointer Design (Single Source of Truth)

To prevent duplication and configuration drift across different AI agent frameworks (Claude Code, Google Antigravity, Codex, Cursor, Gemini CLI, etc.), this workspace uses a unified thin-pointer design. All agent runtimes should load the canonical specifications and candidate profiles from the files and directories below:

1. **Personal Candidate Profile:**
   - The candidate profile, contact details, education, and target preferences are defined in [CLAUDE.md](CLAUDE.md) and the individual profile methodology files under [.claude/skills/job-application-assistant/](.claude/skills/job-application-assistant/) (specifically `01-*.md` etc.).
2. **Canonical Workflow Specifications:**
   - The step-by-step instructions and triggers for tasks (setup, scrape, rank, apply, upskill, interview) are defined in the [.claude/](.claude/) directory (specifically under `.claude/skills/` and `.claude/commands/`).
   - Do not duplicate these rules or specifications. Treat `.claude/` files as the single source of truth.
3. **Portal Search Skills:**
   - Job-portal search CLIs live under [.agents/skills/](.agents/skills/) in the portable Agent Skills format (with a `SKILL.md` per portal). Codex and Antigravity discover these automatically; the `/scrape` workflow in [.claude/skills/job-scraper/](.claude/skills/job-scraper/) orchestrates them.
4. **Cursor adapters (this fork):**
   - Thin skills and rules live under [.cursor/](.cursor/). They must point at `.claude/` specs — do not duplicate workflow prose.
   - US defaults: LinkedIn + FreeHire enabled; Danish demo portals `enabled: false`.
   - Non-portal / failed CLI fetches on Cursor: [.cursor/skills/scrape-router/](.cursor/skills/scrape-router/) (Bun → Firecrawl / Bright Data → Browse).
   - Apply prefers user `resume-tailoring`; interview prefers user `interview-prep` (see `CLAUDE.md` Workflow).

## Cursor Cloud specific instructions

There is no single long-running server for the core product. It is an agent-driven workspace with three runnable subsystems, all runnable from the repo root. Standard commands live in `SETUP.md`, `README.md`, and `.github/workflows/ci.yml` (the `ci.yml` jobs are the canonical lint/test/build parity checklist) — reference those rather than re-deriving commands.

- **Bun portal search CLIs** (`.agents/skills/*/cli`) — the `/scrape` core. `bun` installs to `~/.bun/bin`; if it is not on `PATH` in a fresh shell, invoke it as `"$HOME/.bun/bin/bun"` (the startup update script already does this). Per-CLI commands: `bun install`, `bun run typecheck`, `bun test`, and `bun run src/cli.ts search|detail ...`. Only `linkedin-search` and `freehire-search` are `enabled: true` (US fork); the four Danish portals are `enabled: false` but still typecheck/test. Live `search`/`detail` need network access and hit real portals — run them on demand, keep volume low (LinkedIn is personal-use per its ToS), and never wire them into CI.
- **Python tooling** (`tools/` + `tests/`) — no manifest; only `pyyaml` is needed (already present) for `tools/lint_skills.py`. Run `python3 tools/lint_skills.py`, `python3 tools/security_guards.py`, and `python3 -m unittest discover -s tests -t . -v`. `security_guards.py` fails if `.claude/settings.json` permissions are widened, personal-data gitignore rules are weakened, or CLI `package.json` files gain `dependencies`/lifecycle scripts — keep those invariants when editing.
- **LaTeX document pipeline** (`cv/`, `cover_letters/`) — the `/apply` core. CV compiles with `lualatex` (2 pages), cover letter with `xelatex` (1 page); verify with `python3 tools/verify_pdf.py <pdf> --min-chars 100`. Gotcha: Debian/Ubuntu TeX Live (2023) ships `moderncv` 2.3.1 and only `fontawesome5`, but the templates require `moderncv` ≥ 2.6 (uses `\firstnamestyle`) which in turn requires `fontawesome6`. The setup snapshot installs current `moderncv` + `fontawesome6` into `TEXMFHOME` (`~/texmf`); a fresh full `texlive-full` (or the `texlive/texlive:latest` image CI uses) already includes them.
- **`lovable-app/`** — secondary Vite + React + Supabase scaffold (npm, has a lockfile). `npm run lint`/`npm run build`/`npm run dev` work with no backend, but auth and data actions need a real Supabase project + `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (and edge-function secrets) — it is not fully functional end-to-end without those.
