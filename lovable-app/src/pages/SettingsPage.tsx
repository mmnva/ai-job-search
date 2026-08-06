import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { invokeFunction } from "@/lib/supabase";

export function SettingsPage() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<{
    plan: string;
    applies_used_month: number;
    applies_limit_month: number;
  } | null>(null);
  const [portalFlag, setPortalFlag] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: q } = await supabase
        .from("usage_quotas")
        .select("plan, applies_used_month, applies_limit_month")
        .eq("user_id", user.id)
        .maybeSingle();
      if (q) setQuota(q);
      else {
        await supabase.from("usage_quotas").upsert({
          user_id: user.id,
          plan: "free",
          applies_used_month: 0,
          applies_limit_month: 5,
        });
        setQuota({ plan: "free", applies_used_month: 0, applies_limit_month: 5 });
      }
      const { data: flag } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("key", "portal_search")
        .maybeSingle();
      setPortalFlag(Boolean(flag?.enabled));
    })();
  }, [user]);

  async function checkQuota() {
    setErr(null);
    try {
      const res = await invokeFunction<{
        allowed: boolean;
        used: number;
        limit: number;
        plan: string;
      }>("check-quota", {});
      setMsg(
        res.allowed
          ? `Quota OK — ${res.used}/${res.limit} applies used (${res.plan})`
          : `Quota exceeded — ${res.used}/${res.limit}. Upgrade required.`,
      );
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  return (
    <div className="card">
      <h1>Settings</h1>
      <h2>Plan & quotas</h2>
      {quota ? (
        <p>
          Plan <strong>{quota.plan}</strong>: {quota.applies_used_month} / {quota.applies_limit_month} applies this month
        </p>
      ) : (
        <p className="muted">Loading quota…</p>
      )}
      <button type="button" className="secondary" onClick={() => void checkQuota()}>
        Refresh quota via Edge Function
      </button>
      <p className="muted" style={{ marginTop: 12 }}>
        Stripe checkout/webhooks: see <code>supabase/functions/stripe-webhook</code>. Wire{" "}
        <code>STRIPE_SECRET_KEY</code> before public launch.
      </p>
      <h2>Feature flags</h2>
      <p>
        Portal search:{" "}
        <span className="pill">{portalFlag ? "enabled" : "disabled (v1 default)"}</span>
      </p>
      <h2>Data</h2>
      <p className="muted">
        Account deletion and full JSON export should call a privileged Edge Function with service role.
        Scaffold placeholder only.
      </p>
      {msg && <p>{msg}</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}
