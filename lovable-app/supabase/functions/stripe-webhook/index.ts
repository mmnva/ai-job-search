import { corsHeaders, json, serviceClient } from "../_shared/cors.ts";

/**
 * Stripe webhook stub for SaaS guards.
 * Set STRIPE_WEBHOOK_SECRET and verify signatures before production.
 * On checkout.session.completed / customer.subscription.updated:
 * update usage_quotas.plan and applies_limit_month.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  try {
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      return json(
        {
          error: "STRIPE_WEBHOOK_SECRET not configured",
          hint: "Wire Stripe before public multi-tenant launch",
        },
        501,
      );
    }

    // Signature verification should use Stripe SDK / subtle crypto in production.
    // Placeholder accepts JSON events for local wiring tests only when
    // STRIPE_WEBHOOK_ALLOW_INSECURE=1
    if (Deno.env.get("STRIPE_WEBHOOK_ALLOW_INSECURE") !== "1") {
      return json({
        error: "Implement Stripe signature verification before enabling",
      }, 501);
    }

    const event = await req.json();
    const svc = serviceClient();
    const type = event?.type as string | undefined;

    if (type === "checkout.session.completed" || type === "customer.subscription.updated") {
      const customerId = event?.data?.object?.customer as string | undefined;
      const userId = event?.data?.object?.metadata?.supabase_user_id as string | undefined;
      if (userId) {
        await svc.from("usage_quotas").upsert({
          user_id: userId,
          plan: "pro",
          applies_limit_month: 100,
          stripe_customer_id: customerId ?? null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    return json({ received: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
