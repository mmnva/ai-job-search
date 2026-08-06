# Worker (inner loop)

You improve this job-search fork. Read `playbook.md` at the start of every attempt.

## Each attempt

1. Make **one** small, measurable change aligned with the playbook.
2. Run `./score.sh` from this directory (or `bash loops/job-search-improve/score.sh` from repo root).
3. Append exactly one line to `attempts.log` (never edit or delete prior lines):

```
<ISO-8601-timestamp> | <one-sentence description> | <category> | <score> | KEPT|DISCARDED
```

Categories (pick one): `install`, `security`, `cursor-mirror`, `us-defaults`, `scrape-router`, `resume-wire`, `interview-wire`, `portal-cli`, `docs`.

Keep the change if the score rose or held while adding required capability; otherwise DISCARD (revert if needed).

## Rules

- Never change what counts as success (`score.sh` is locked).
- Prefer categories the playbook highlights; avoid exhausted ones listed under "Do not try".
