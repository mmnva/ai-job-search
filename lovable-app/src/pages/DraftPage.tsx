import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { invokeFunction, supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function DraftPage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const [resume, setResume] = useState("");
  const [cover, setCover] = useState("");
  const [review, setReview] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function draft() {
    if (!applicationId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await invokeFunction<{
        resume_markdown: string;
        cover_markdown: string;
        stretch_flags?: unknown;
      }>("draft-application", { application_id: applicationId });
      setResume(res.resume_markdown);
      setCover(res.cover_markdown);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function runReview() {
    if (!applicationId) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await invokeFunction<{ review: unknown }>("review-application", {
        application_id: applicationId,
        resume_markdown: resume,
        cover_markdown: cover,
      });
      setReview(res.review);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function saveDocs() {
    if (!user || !applicationId) return;
    setBusy(true);
    setErr(null);
    const rows = [
      { user_id: user.id, application_id: applicationId, doc_type: "resume" as const, markdown_body: resume, version: 1 },
      { user_id: user.id, application_id: applicationId, doc_type: "cover" as const, markdown_body: cover, version: 1 },
    ];
    const { error } = await supabase.from("documents").upsert(rows, {
      onConflict: "application_id,doc_type",
    });
    // upsert may fail without unique constraint — fall back to delete+insert
    if (error) {
      await supabase.from("documents").delete().eq("application_id", applicationId);
      const { error: e2 } = await supabase.from("documents").insert(rows);
      if (e2) {
        setErr(e2.message);
        setBusy(false);
        return;
      }
    }
    setSaved(true);
    setBusy(false);
  }

  useEffect(() => {
    void draft();
  }, [applicationId]);

  return (
    <div>
      <div className="card no-print">
        <h1>Draft studio</h1>
        <p className="muted">Markdown resume + cover. Reviewer is a second LLM pass.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void draft()}>Regenerate</button>
          <button type="button" className="secondary" disabled={busy || !resume} onClick={() => void runReview()}>
            Run reviewer
          </button>
          <button type="button" className="secondary" disabled={busy} onClick={() => void saveDocs()}>
            Save documents
          </button>
          <Link className="btn" to={`/apply/${applicationId}/export`}>Export PDF</Link>
        </div>
        {err && <p className="error">{err}</p>}
        {saved && <p className="muted">Saved.</p>}
      </div>
      <div className="grid-2">
        <div className="card">
          <h2>Resume</h2>
          <textarea rows={22} value={resume} onChange={(e) => setResume(e.target.value)} />
        </div>
        <div className="card">
          <h2>Cover letter</h2>
          <textarea rows={22} value={cover} onChange={(e) => setCover(e.target.value)} />
        </div>
      </div>
      {review != null && (
        <div className="card no-print">
          <h2>Reviewer</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{JSON.stringify(review, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
