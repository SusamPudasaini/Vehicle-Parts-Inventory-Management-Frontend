import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, CalendarCheck, FileText, LogOut, Monitor, PackageCheck, PackageSearch, Search, UserPlus, Users, Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "./BrandLogo";
import PageTransition from "./PageTransition";

const adminLinks = [
  {
    to: "/admin/staff", label: "Staff",
    icon: Users,
  },
  {
    to: "/admin/vendors", label: "Vendors",
    icon: Monitor,
  },
  {
    to: "/admin/parts", label: "Parts",
    icon: Wrench,
  },
  {
    to: "/admin/part-requests", label: "Part Requests",
    icon: PackageSearch,
  },
  {
    to: "/admin/invoices", label: "Purchase Invoices",
    icon: FileText,
  },
  {
    to: "/admin/reports", label: "Reports",
    icon: BarChart3,
  },
];

const staffLinks = [
  {
    to: "/staff/register-customer", label: "Register Customer",
    icon: UserPlus,
  },
  {
    to: "/staff/customers", label: "Customers",
    icon: Users,
  },
  {
    to: "/staff/appointments", label: "Appointments",
    icon: CalendarCheck,
  },
  {
    to: "/staff/part-orders", label: "Part Orders",
    icon: PackageCheck,
  },
  {
    to: "/staff/part-requests", label: "Part Requests",
    icon: PackageSearch,
  },
  {
    to: "/staff/search", label: "Search",
    icon: Search,
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
          <BrandLogo size={34} />
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
            <LogOut size={13} strokeWidth={2.2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
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

function SideLink({ to, label, icon: Icon }) {
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
      <span style={{ opacity: 0.85, display: "flex" }}>
        <Icon size={16} strokeWidth={2.1} />
      </span>
      {label}
    </NavLink>
  );
}
