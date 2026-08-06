# Phase B — Portal search

## Flag
`feature_flags.portal_search` defaults to **false**.

## Implementation status
- Edge Function `portal-search` calls **FreeHire** public JSON API (`FREEHIRE_API_URL` or `https://freehire.me`).
- Returns **403** while the flag is off.
- UI: `/search` shows disabled state until flag enabled; then lists results and “Start apply”.

## LinkedIn
Bulk LinkedIn guest scraping is **not implemented** for SaaS. User-supplied LinkedIn job URLs remain supported via v1 `fetch-jd`. Enable LinkedIn bulk search only after legal/ToS review.

## Enable for testing
```sql
update feature_flags set enabled = true where key = 'portal_search';
```
