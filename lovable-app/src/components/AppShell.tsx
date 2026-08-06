import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="shell">
      <nav className="nav no-print">
        <NavLink to="/" className="brand" end>
          Application Ledger
        </NavLink>
        {user && (
          <>
            <NavLink to="/pipeline">Pipeline</NavLink>
            <NavLink to="/apply/new">New apply</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/search">Search</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            <button type="button" className="secondary" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        )}
      </nav>
      {children}
    </div>
  );
}
