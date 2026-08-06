"""Contract tests for US scrape-router and portal enablement (no live network)."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _frontmatter_enabled(skill_md: Path) -> bool | None:
    text = skill_md.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end < 0:
        return None
    fm = text[3:end]
    m = re.search(r"^enabled:\s*(true|false)\b", fm, re.MULTILINE)
    if not m:
        return None
    return m.group(1) == "true"


class ScrapeRouterContractTest(unittest.TestCase):
    def test_scrape_router_skill_exists_with_ladder_order(self) -> None:
        path = ROOT / ".cursor" / "skills" / "scrape-router" / "SKILL.md"
        self.assertTrue(path.is_file(), f"missing {path}")
        body = path.read_text(encoding="utf-8")
        for marker in ("Bun portal CLI", "Firecrawl", "Bright Data", "Browse"):
            self.assertIn(marker, body, f"scrape-router missing marker: {marker}")
        bun_i = body.index("Bun portal CLI")
        fire_i = body.index("Firecrawl")
        bright_i = body.index("Bright Data")
        browse_i = body.index("Browse")
        self.assertLess(bun_i, min(fire_i, bright_i))
        self.assertLess(max(fire_i, bright_i), browse_i)

    def test_us_portal_enablement(self) -> None:
        enabled_true = ("linkedin-search", "freehire-search")
        enabled_false = (
            "jobbank-search",
            "jobdanmark-search",
            "jobindex-search",
            "jobnet-search",
        )
        for name in enabled_true:
            path = ROOT / ".agents" / "skills" / name / "SKILL.md"
            self.assertTrue(_frontmatter_enabled(path), f"{name} should be enabled")
        for name in enabled_false:
            path = ROOT / ".agents" / "skills" / name / "SKILL.md"
            self.assertFalse(_frontmatter_enabled(path), f"{name} should be disabled")

    def test_search_queries_us_section(self) -> None:
        path = ROOT / ".claude" / "skills" / "job-scraper" / "search-queries.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("US market defaults", text)
        self.assertIn("linkedin-search", text)
        self.assertIn("freehire-search", text)
        self.assertIn("scrape-router", text)

    def test_scrape_adapter_points_at_so_t_and_router(self) -> None:
        path = ROOT / ".cursor" / "skills" / "scrape" / "SKILL.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn(".claude/skills/job-scraper", text)
        self.assertIn("scrape-router", text)

    def test_workflow_skill_stubs_exist(self) -> None:
        for name in ("setup", "scrape", "rank", "apply", "interview"):
            path = ROOT / ".cursor" / "skills" / name / "SKILL.md"
            self.assertTrue(path.is_file(), f"missing {path}")
        rule = ROOT / ".cursor" / "rules" / "ai-job-search.mdc"
        self.assertTrue(rule.is_file(), f"missing {rule}")


if __name__ == "__main__":
    unittest.main()
