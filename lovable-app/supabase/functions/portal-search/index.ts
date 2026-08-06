import {
  assertRateLimit,
  corsHeaders,
  json,
  serviceClient,
  userClient,
} from "../_shared/cors.ts";

const DEFAULT_BASE = "https://freehire.me";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  try {
    const { user } = await userClient(req);
    await assertRateLimit(user.id);

    const svc = serviceClient();
    const { data: flag } = await svc
      .from("feature_flags")
      .select("enabled")
      .eq("key", "portal_search")
      .maybeSingle();

    if (!flag?.enabled) {
      return json(
        {
          error:
            "portal_search feature flag is disabled. v1 uses paste/URL intake only. FreeHire search is Phase B.",
        },
        403,
      );
    }

    const { query, location } = (await req.json()) as {
      query?: string;
      location?: string;
    };
    if (!query) return json({ error: "query required" }, 400);

    // FreeHire first (public JSON API). LinkedIn bulk guest search is NOT implemented
    // here — legal review required before any SaaS LinkedIn scrape.
    const base = (Deno.env.get("FREEHIRE_API_URL") ?? DEFAULT_BASE).replace(/\/+$/, "");
    const params = new URLSearchParams({
      q: query,
      limit: "20",
    });
    if (location) params.set("location", location);

    const res = await fetch(`${base}/api/jobs?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ai-job-search-app/0.1 (+portal-search)",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return json({ error: `FreeHire API ${res.status}` }, 502);
    }
    const body = await res.json();
    const rows = Array.isArray(body?.data) ? body.data : [];
    const results = rows.map((j: Record<string, unknown>) => ({
      id: String(j.public_slug ?? j.external_id ?? j.url),
      title: String(j.title ?? ""),
      company: String(j.company ?? ""),
      location: String(j.location ?? ""),
      url: String(j.url ?? ""),
      portal: "freehire",
    }));

    await svc.from("agent_runs").insert({
      user_id: user.id,
      workflow: "portal_search",
      status: "ok",
      input_refs: { query, location },
      output: { count: results.length },
      token_usage: 0,
      finished_at: new Date().toISOString(),
    });

    return json({ results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
