import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function ExportPage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const [resume, setResume] = useState("");
  const [cover, setCover] = useState("");
  const [meta, setMeta] = useState<{ company?: string; title?: string }>({});

  useEffect(() => {
    if (!applicationId) return;
    void (async () => {
      const { data: docs } = await supabase
        .from("documents")
        .select("doc_type, markdown_body")
        .eq("application_id", applicationId);
      for (const d of docs ?? []) {
        if (d.doc_type === "resume") setResume(d.markdown_body);
        if (d.doc_type === "cover") setCover(d.markdown_body);
      }
      const { data: app } = await supabase
        .from("applications")
        .select("job_id")
        .eq("id", applicationId)
        .single();
      if (app) {
        const { data: job } = await supabase
          .from("jobs")
          .select("company, title")
          .eq("id", app.job_id)
          .single();
        if (job) setMeta({ company: job.company ?? undefined, title: job.title ?? undefined });
      }
    })();
  }, [applicationId]);

  async function markExported() {
    if (!user || !applicationId) return;
    // Client-side print/PDF; path recorded as local export marker
    await supabase
      .from("documents")
      .update({ pdf_path: `exports/${user.id}/${applicationId}.print` })
      .eq("application_id", applicationId);
    window.print();
  }

  return (
    <div>
      <div className="card no-print">
        <h1>Export</h1>
        <p className="muted">
          Print or Save as PDF from the browser. Files stay private; upload to Storage can be added when buckets are configured.
        </p>
        <button type="button" onClick={() => void markExported()}>Print / Save as PDF</button>{" "}
        <Link className="btn secondary" to="/pipeline">Pipeline</Link>
      </div>
      <article className="card" id="export-resume">
        <h2>{meta.title ? `${meta.title} — Resume` : "Resume"}</h2>
        <div className="markdown-body">{resume}</div>
      </article>
      <article className="card" id="export-cover">
        <h2>{meta.company ? `Cover — ${meta.company}` : "Cover letter"}</h2>
        <div className="markdown-body">{cover}</div>
      </article>
    </div>
  );
}
