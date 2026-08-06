import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { invokeFunction, supabase } from "@/lib/supabase";

export function NewApplyPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function fetchUrl() {
    setBusy(true);
    setErr(null);
    try {
      const res = await invokeFunction<{
        text: string;
        title?: string;
        company?: string;
        fetch_status: string;
      }>("fetch-jd", { url });
      setRawText(res.text || "");
      if (res.title) setTitle(res.title);
      if (res.company) setCompany(res.company);
      if (res.fetch_status === "login_wall") {
        setErr("Login wall or blocked fetch. Paste the posting text instead.");
      }
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!rawText.trim()) {
      setErr("Job text is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        ingest_channel: mode,
        source_url: mode === "url" ? url : null,
        title: title || null,
        company: company || null,
        location: location || null,
        raw_text: rawText,
        fetch_status: "ok",
        fetched_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !job) {
      setBusy(false);
      setErr(error?.message ?? "Failed to create job");
      return;
    }
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .insert({ user_id: user.id, job_id: job.id, status: "active", channel: mode })
      .select("id")
      .single();
    setBusy(false);
    if (appErr || !app) {
      setErr(appErr?.message ?? "Failed to create application");
      return;
    }
    nav(`/apply/${app.id}/evaluate`);
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h1>New application</h1>
      <p className="muted">v1 intake: paste JD or provide a URL. Portal search comes later.</p>
      <div className="field">
        <label>Intake</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as "paste" | "url")}>
          <option value="paste">Paste text</option>
          <option value="url">URL fetch</option>
        </select>
      </div>
      {mode === "url" && (
        <div className="field">
          <label htmlFor="url">Job posting URL (user-supplied only)</label>
          <input id="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="secondary" style={{ marginTop: 8 }} disabled={busy || !url} onClick={() => void fetchUrl()}>
            Fetch posting
          </button>
        </div>
      )}
      <div className="grid-2">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="company">Company</label>
          <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="loc">Location</label>
        <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="raw">Posting text</label>
        <textarea id="raw" rows={14} value={rawText} onChange={(e) => setRawText(e.target.value)} required />
      </div>
      {err && <p className="error">{err}</p>}
      <button type="submit" disabled={busy}>{busy ? "Working…" : "Continue to fit evaluation"}</button>
    </form>
  );
}
