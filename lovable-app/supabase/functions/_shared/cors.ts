import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}

export async function userClient(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Missing Authorization");
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return { supabase, user: data.user };
}

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

/** Call OpenAI-compatible or Anthropic chat; returns text + rough token estimate. */
export async function llmChat(
  system: string,
  user: string,
): Promise<{ text: string; tokens: number; model: string }> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (anthropicKey) {
    const model = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message ?? "Anthropic error");
    const text = body.content?.[0]?.text ?? "";
    const tokens =
      (body.usage?.input_tokens ?? 0) + (body.usage?.output_tokens ?? 0);
    return { text, tokens, model };
  }

  const key = openaiKey || lovableKey;
  if (!key) {
    throw new Error(
      "No LLM API key configured (ANTHROPIC_API_KEY, OPENAI_API_KEY, or LOVABLE_API_KEY)",
    );
  }
  const base =
    Deno.env.get("OPENAI_BASE_URL") ??
    (lovableKey && !openaiKey
      ? "https://ai.gateway.lovable.dev/v1"
      : "https://api.openai.com/v1");
  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? "OpenAI-compatible error");
  const text = body.choices?.[0]?.message?.content ?? "";
  const tokens = body.usage?.total_tokens ?? Math.ceil((system.length + user.length + text.length) / 4);
  return { text, tokens, model };
}

export function parseJsonLoose(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(raw.slice(start, end + 1));
  }
  return JSON.parse(raw);
}

export async function assertQuota(userId: string): Promise<void> {
  const svc = serviceClient();
  const period = new Date().toISOString().slice(0, 7).replace("-", "");
  const { data } = await svc
    .from("usage_quotas")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  let row = data;
  if (!row) {
    const { data: created } = await svc
      .from("usage_quotas")
      .insert({
        user_id: userId,
        plan: "free",
        applies_used_month: 0,
        applies_limit_month: 5,
        period_yyyymm: period,
      })
      .select("*")
      .single();
    row = created;
  } else if (row.period_yyyymm !== period) {
    const { data: reset } = await svc
      .from("usage_quotas")
      .update({
        applies_used_month: 0,
        period_yyyymm: period,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();
    row = reset;
  }
  if (!row) throw new Error("Quota unavailable");
  if (row.applies_used_month >= row.applies_limit_month) {
    throw new Error(
      `Monthly apply quota exceeded (${row.applies_used_month}/${row.applies_limit_month}). Upgrade plan.`,
    );
  }
}

export async function incrementQuota(userId: string): Promise<void> {
  const svc = serviceClient();
  const { data } = await svc
    .from("usage_quotas")
    .select("applies_used_month")
    .eq("user_id", userId)
    .single();
  if (!data) return;
  await svc
    .from("usage_quotas")
    .update({
      applies_used_month: data.applies_used_month + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/** Minimal rate limit: max N agent_runs per user per rolling hour. */
export async function assertRateLimit(userId: string, maxPerHour = 30): Promise<void> {
  const svc = serviceClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await svc
    .from("agent_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw error;
  if ((count ?? 0) >= maxPerHour) {
    throw new Error("Rate limit exceeded. Try again later.");
  }
}
