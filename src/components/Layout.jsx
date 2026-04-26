import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminLinks = [
  {
    to: "/admin/staff", label: "Staff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    to: "/admin/vendors", label: "Vendors",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
  },
];

const staffLinks = [
  {
    to: "/staff/register-customer", label: "Register Customer",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  },
  {
    to: "/staff/customers", label: "Customers",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    to: "/staff/search", label: "Search",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "Admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--surface)" }}>
      {/* Sidebar */}
      <aside style={{
        width: "220px", flexShrink: 0,
        background: "var(--purple-950)",
        display: "flex", flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg, var(--purple-500), var(--accent))",
              borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: "700", color: "white", flexShrink: 0,
            }}>
              VP
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "white", lineHeight: 1.2, margin: 0 }}>VehicleParts</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", lineHeight: 1.2, margin: 0 }}>Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          {/* Admin-only links */}
          {isAdmin && (
            <>
              <SectionLabel>Admin</SectionLabel>
              {adminLinks.map((link) => <SideLink key={link.to} {...link} />)}
            </>
          )}

          {/* Staff links — visible to both roles */}
          <SectionLabel style={{ marginTop: isAdmin ? "20px" : "8px" }}>Staff</SectionLabel>
          {staffLinks.map((link) => <SideLink key={link.to} {...link} />)}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--purple-500), var(--accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: "700", color: "white",
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "12px", fontWeight: "500", color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName}
              </p>
              <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", padding: "7px", borderRadius: "7px",
              background: "rgba(255,255,255,0.06)", border: "none",
              color: "rgba(255,255,255,0.45)", fontSize: "12px",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 36px" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <p style={{
      fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em",
      textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
      padding: "0 10px", marginBottom: "4px", marginTop: "8px", margin: "8px 0 4px",
      ...style,
    }}>
      {children}
    </p>
  );
}

function SideLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px", borderRadius: "7px",
        fontSize: "13.5px", fontWeight: "500",
        marginBottom: "2px", textDecoration: "none",
        color: isActive ? "white" : "rgba(255,255,255,0.45)",
        background: isActive ? "rgba(139,92,246,0.35)" : "transparent",
      })}
    >
      <span style={{ opacity: 0.8 }}>{icon}</span>
      {label}
    </NavLink>
  );
}
