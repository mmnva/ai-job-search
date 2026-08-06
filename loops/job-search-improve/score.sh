#!/usr/bin/env bash
# Locked verifier for bi-level loop. Coach must NEVER edit this file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

score=0
detail=()

add() {
  local pts="$1"
  local ok="$2"
  local label="$3"
  if [[ "$ok" == "1" ]]; then
    score=$((score + pts))
    detail+=("PASS ${pts} ${label}")
  else
    detail+=("FAIL ${pts} ${label}")
  fi
}

# 25 — security guards
if python3 tools/security_guards.py >/dev/null 2>&1; then
  add 25 1 "security_guards"
else
  add 25 0 "security_guards"
fi

# 25 — python unit tests (full suite)
if python3 -m unittest discover -s tests -q >/dev/null 2>&1; then
  add 25 1 "python_unittest"
else
  add 25 0 "python_unittest"
fi

# 20 — LinkedIn + FreeHire typecheck
tc_ok=1
for portal in linkedin-search freehire-search; do
  if ! (cd ".agents/skills/${portal}/cli" && bun run typecheck >/dev/null 2>&1); then
    tc_ok=0
  fi
done
add 20 "$tc_ok" "portal_typecheck"

# 15 — Cursor rule + five workflow skill stubs
cursor_ok=1
[[ -f .cursor/rules/ai-job-search.mdc ]] || cursor_ok=0
for name in setup scrape rank apply interview; do
  [[ -f ".cursor/skills/${name}/SKILL.md" ]] || cursor_ok=0
done
add 15 "$cursor_ok" "cursor_stubs"

# 15 — scrape-router contract (US order + ladder)
if python3 -m unittest tests.test_scrape_router_contract -q >/dev/null 2>&1; then
  add 15 1 "scrape_router_contract"
else
  add 15 0 "scrape_router_contract"
fi

printf '%s\n' "${detail[@]}" >&2
echo "$score"
exit 0
