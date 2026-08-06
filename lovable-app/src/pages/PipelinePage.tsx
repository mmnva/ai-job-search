import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  jobs: { title: string | null; company: string | null; location: string | null } | null;
};

export function PipelinePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("applications")
      .select("id, status, notes, created_at, jobs(title, company, location)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [user]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      const hay = `${r.jobs?.company ?? ""} ${r.jobs?.title ?? ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [rows, status, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  return (
    <div>
      <div className="card">
        <h1>Pipeline</h1>
        <p className="muted">Application ledger — {rows.length} total</p>
        <div className="stat-row">
          {["active", "interview", "offer", "hired", "closed"].map((s) => (
            <div className="stat" key={s}>
              <strong>{counts[s] ?? 0}</strong>
              <span className="muted">{s}</span>
            </div>
          ))}
        </div>
        <div className="grid-2 no-print">
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="field">
            <label>Search</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Company or role" />
          </div>
        </div>
        <p className="no-print">
          <Link className="btn" to="/apply/new">New application</Link>
        </p>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                <td>{r.jobs?.company ?? "—"}</td>
                <td>{r.jobs?.title ?? "—"}</td>
                <td><span className="pill">{r.status}</span></td>
                <td>
                  <Link to={`/apply/${r.id}/evaluate`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="muted">No applications yet.</p>}
      </div>
    </div>
  );
}
