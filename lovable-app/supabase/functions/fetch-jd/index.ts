import {
  assertRateLimit,
  corsHeaders,
  json,
  userClient,
} from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  try {
    const { user, supabase } = await userClient(req);
    await assertRateLimit(user.id);
    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== "string") {
      return json({ error: "url required" }, 400);
    }
    // Only fetch the user-supplied URL (09-web-research trust boundary).
    let fetch_status: "ok" | "failed" | "login_wall" = "ok";
    let text = "";
    let title = "";
    let company = "";
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ApplicationLedger/0.1; +https://github.com/mmnva/ai-job-search)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.status === 401 || res.status === 403) fetch_status = "login_wall";
      else if (!res.ok) fetch_status = "failed";
      const html = await res.text();
      text = html
        .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/[ \t\xa0]+/g, " ")
        .replace(/\n\s*\n+/g, "\n")
        .trim()
        .slice(0, 20000);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch?.[1]?.trim() ?? "";
    } catch {
      fetch_status = "failed";
    }

    await supabase.from("agent_runs").insert({
      user_id: user.id,
      workflow: "fetch",
      status: fetch_status === "ok" ? "ok" : "error",
      input_refs: { url },
      output: { fetch_status, title, company },
      token_usage: 0,
      finished_at: new Date().toISOString(),
    });

    return json({ text, title, company, fetch_status });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
