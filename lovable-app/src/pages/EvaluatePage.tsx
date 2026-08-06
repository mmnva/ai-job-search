import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { invokeFunction, supabase } from "@/lib/supabase";

type EvalResult = {
  evaluation_id: string;
  fit_score: number | null;
  recommendation: string;
  summary?: string;
  gaps?: unknown;
  raw_output?: Record<string, unknown>;
};

export function EvaluatePage() {
  const { applicationId } = useParams();
  const nav = useNavigate();
  const [result, setResult] = useState<EvalResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [override, setOverride] = useState(false);

  async function run() {
    if (!applicationId) return;
    setBusy(true);
    setErr(null);
    try {
      const { data: app } = await supabase
        .from("applications")
        .select("id, job_id")
        .eq("id", applicationId)
        .single();
      if (!app) throw new Error("Application not found");
      const res = await invokeFunction<EvalResult>("evaluate-job", {
        application_id: applicationId,
        job_id: app.job_id,
      });
      setResult(res);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void run();
  }, [applicationId]);

  const blocked = result?.recommendation === "no_go" && !override;

  return (
    <div className="card">
      <h1>Fit evaluation</h1>
      <p className="muted">Human gate: review score before drafting.</p>
      {busy && <p>Evaluating…</p>}
      {err && <p className="error">{err}</p>}
      {result && (
        <>
          <p>
            <span className={`pill ${result.recommendation}`}>{result.recommendation}</span>{" "}
            <strong style={{ fontSize: "1.4rem", marginLeft: 8 }}>{result.fit_score ?? "—"}</strong>
            <span className="muted"> / 100</span>
          </p>
          {result.summary && <p>{result.summary}</p>}
          <pre className="muted" style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {JSON.stringify(result.raw_output ?? result.gaps, null, 2)}
          </pre>
          {result.recommendation === "no_go" && (
            <label className="field">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />{" "}
              Override gate and draft anyway (acknowledged)
            </label>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={blocked} onClick={() => nav(`/apply/${applicationId}/draft`)}>
              Continue to draft
            </button>
            <Link className="btn secondary" to="/pipeline">Back to pipeline</Link>
          </div>
        </>
      )}
      {!busy && !result && !err && (
        <button type="button" onClick={() => void run()}>Run evaluation</button>
      )}
    </div>
  );
}
