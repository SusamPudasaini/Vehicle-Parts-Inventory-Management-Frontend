import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarCheck, Car, History, Home, LogOut, Package, PackageSearch, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "./BrandLogo";
import PageTransition from "./PageTransition";

const customerLinks = [
  { to: "/customer/dashboard", label: "Overview", icon: Home },
  { to: "/customer/profile", label: "Profile", icon: User },
  { to: "/customer/vehicles", label: "Vehicles", icon: Car },
  { to: "/customer/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/customer/parts", label: "Purchase Parts", icon: Package },
  { to: "/customer/part-requests", label: "Unavailable Parts", icon: PackageSearch },
  { to: "/customer/history", label: "View History", icon: History },
];

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/customer-auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Local logout still clears the portal session if the network request fails.
    }

    logout();
    navigate("/customer-login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--surface)" }}>
      <aside style={{
        width: "220px",
        flexShrink: 0,
        background: "var(--purple-950)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <BrandLogo size={34} subtitle="Customer Portal" />
        </div>

        <nav style={{ flex: 1, padding: "16px 10px", overflowY: "auto" }}>
          <SectionLabel>Customer</SectionLabel>
          {customerLinks.map((link) => <SideLink key={link.to} {...link} />)}
        </nav>

        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              flexShrink: 0,
              background: "linear-gradient(135deg, var(--purple-500), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
              color: "white",
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "12px", fontWeight: "500", color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName}
              </p>
              <p style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Customer
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "7px",
              borderRadius: "7px",
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "rgba(255,255,255,0.45)",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
          >
            <LogOut size={13} strokeWidth={2.2} />
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 36px" }}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: "10px",
      fontWeight: "600",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.25)",
      padding: "0 10px",
      marginBottom: "4px",
      marginTop: "8px",
    }}>
      {children}
    </p>
  );
}

function SideLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "7px",
        fontSize: "13.5px",
        fontWeight: "500",
        marginBottom: "2px",
        textDecoration: "none",
        color: isActive ? "white" : "rgba(255,255,255,0.45)",
        background: isActive ? "rgba(139,92,246,0.35)" : "transparent",
      })}
    >
      <span style={{ opacity: 0.85, display: "flex" }}>
        <Icon size={16} strokeWidth={2.1} />
      </span>
      {label}
    </NavLink>
  );
}
