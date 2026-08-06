# Scrape router reference

## Tier map

| Tier | When | Tool |
|------|------|------|
| 0 | Enabled portal skill matches query/URL | Bun CLI under `.agents/skills/<portal>/cli` |
| 1 | CLI miss/fail or non-portal career URL | Firecrawl scrape / Bright Data `scrape_as_markdown` (or batch) |
| 2 | Needs interaction | Browse `browser-automation` |

## Failure codes (agent-facing)

- `portal-disabled` — skill `enabled: false`; skip tier 0 for that portal
- `cli-error` — non-zero exit / stderr JSON; try tier 1
- `empty-results` — success shape but no cards; try next portal or tier 1 for URL fetches
- `blocked-403` — unlocker/browse escalation
- `login-wall` — find employer careers URL; do not invent JD from title alone

## Related SoT

- `.claude/skills/job-scraper/SKILL.md` — orchestration
- `.claude/skills/job-application-assistant/09-web-research.md` — trust + robots
- `.claude/skills/job-scraper/search-queries.md` — US defaults
