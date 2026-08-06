import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invokeFunction, supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Hit = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  portal: string;
};

export function SearchPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("United States");
  const [hits, setHits] = useState<Hit[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", "portal_search")
      .maybeSingle()
      .then(({ data }) => setEnabled(Boolean(data?.enabled)));
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await invokeFunction<{ results: Hit[] }>("portal-search", {
        query,
        location,
      });
      setHits(res.results ?? []);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
      setHits([]);
    } finally {
      setBusy(false);
    }
  }

  async function startApply(hit: Hit) {
    if (!user) return;
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        ingest_channel: "portal",
        portal: hit.portal,
        source_url: hit.url,
        title: hit.title,
        company: hit.company,
        location: hit.location,
        raw_text: `${hit.title} at ${hit.company}\n${hit.location}\n${hit.url}`,
        fetch_status: "ok",
        fetched_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !job) {
      setErr(error?.message ?? "Failed");
      return;
    }
    const { data: app } = await supabase
      .from("applications")
      .insert({ user_id: user.id, job_id: job.id, status: "active", channel: "portal" })
      .select("id")
      .single();
    if (app) nav(`/apply/${app.id}/evaluate`);
  }

  if (!enabled) {
    return (
      <div className="card">
        <h1>Portal search</h1>
        <p>
          Phase B is behind a feature flag. <code>portal_search</code> is currently{" "}
          <strong>disabled</strong>. Use{" "}
          <a href="/apply/new">paste / URL intake</a> for v1.
        </p>
        <p className="muted">
          When enabled: FreeHire API first. LinkedIn bulk guest search requires legal review before
          shipping on a public SaaS.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form className="card" onSubmit={onSearch}>
        <h1>Portal search</h1>
        <div className="grid-2">
          <div className="field">
            <label>Query</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} required />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={busy}>{busy ? "Searching…" : "Search FreeHire"}</button>
        {err && <p className="error">{err}</p>}
      </form>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Location</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {hits.map((h) => (
              <tr key={h.id}>
                <td>{h.title}</td>
                <td>{h.company}</td>
                <td>{h.location}</td>
                <td>
                  <button type="button" className="secondary" onClick={() => void startApply(h)}>
                    Start apply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
