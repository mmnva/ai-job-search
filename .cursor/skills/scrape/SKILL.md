---
name: scrape
description: >-
  Cursor mirror of /scrape — find jobs via enabled portal CLIs (US: LinkedIn +
  FreeHire). Use when searching for new job postings, scraping jobs, or running
  portal health checks.
---

# Scrape (Cursor adapter)

Follow `.claude/skills/job-scraper/SKILL.md` and `.claude/skills/job-scraper/search-queries.md` exactly.

**Cursor additions:**

- Honor US defaults: LinkedIn + FreeHire enabled; Danish portals disabled unless re-enabled.
- On CLI miss/failure or non-portal career URLs, use `.cursor/skills/scrape-router` (Bun → Firecrawl / Bright Data → Browse) instead of WebSearch-only fallback.
