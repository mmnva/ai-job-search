# SaaS guards (quotas, rate limits, Stripe)

## Quotas
- Table `usage_quotas`: free plan default **5 applies / calendar month**.
- `assertQuota` + `incrementQuota` in Edge `_shared` (draft counts as an apply).
- `check-quota` function for Settings UI.

## Rate limits
- `assertRateLimit`: max **30** `agent_runs` per user per rolling hour.

## Stripe
- `stripe-webhook` stub returns 501 until `STRIPE_WEBHOOK_SECRET` is set and signature verification is implemented.
- On paid checkout, set `plan=pro` and `applies_limit_month=100` (adjust in product).
- Store `supabase_user_id` in Stripe Checkout `metadata`.

## Before public launch checklist
- [ ] Stripe products + webhook endpoint live
- [ ] Signature verification (no `STRIPE_WEBHOOK_ALLOW_INSECURE`)
- [ ] Private Storage buckets + RLS
- [ ] LLM keys only in Edge secrets
- [ ] Monitor `agent_runs.token_usage` cost
