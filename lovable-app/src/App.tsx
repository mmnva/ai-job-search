import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { AuthPage } from "@/pages/AuthPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NewApplyPage } from "@/pages/NewApplyPage";
import { EvaluatePage } from "@/pages/EvaluatePage";
import { DraftPage } from "@/pages/DraftPage";
import { ExportPage } from "@/pages/ExportPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SearchPage } from "@/pages/SearchPage";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted">Loading…</p>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setComplete(Boolean(data?.onboarding_complete));
        setReady(true);
      });
  }, [user]);

  if (!ready) return <p className="muted">Loading profile…</p>;
  return <Navigate to={complete ? "/pipeline" : "/profile"} replace />;
}

function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomeRedirect />
            </RequireAuth>
          }
        />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/pipeline" element={<RequireAuth><PipelinePage /></RequireAuth>} />
        <Route path="/apply/new" element={<RequireAuth><NewApplyPage /></RequireAuth>} />
        <Route path="/apply/:applicationId/evaluate" element={<RequireAuth><EvaluatePage /></RequireAuth>} />
        <Route path="/apply/:applicationId/draft" element={<RequireAuth><DraftPage /></RequireAuth>} />
        <Route path="/apply/:applicationId/export" element={<RequireAuth><ExportPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
