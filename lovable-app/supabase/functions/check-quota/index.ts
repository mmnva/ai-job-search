import { corsHeaders, json, userClient } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  try {
    const { user, supabase } = await userClient(req);
    const period = new Date().toISOString().slice(0, 7).replace("-", "");
    let { data } = await supabase
      .from("usage_quotas")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      const inserted = await supabase
        .from("usage_quotas")
        .insert({
          user_id: user.id,
          plan: "free",
          applies_used_month: 0,
          applies_limit_month: 5,
          period_yyyymm: period,
        })
        .select("*")
        .single();
      data = inserted.data;
    } else if (data.period_yyyymm !== period) {
      const updated = await supabase
        .from("usage_quotas")
        .update({
          applies_used_month: 0,
          period_yyyymm: period,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select("*")
        .single();
      data = updated.data;
    }

    if (!data) return json({ error: "quota missing" }, 500);

    return json({
      allowed: data.applies_used_month < data.applies_limit_month,
      used: data.applies_used_month,
      limit: data.applies_limit_month,
      plan: data.plan,
      period: data.period_yyyymm,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
