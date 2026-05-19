import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, Plus, User } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { customerProfileApi } from "../../services/api";
import { Badge, Button, Card, PageHeader, Spinner } from "../../components/ui";

function StatCard({ label, value, hint, onClick }) {
  const content = (
    <Card style={{ padding: "18px", height: "100%" }}>
      <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: "28px", fontWeight: "700", color: "#1a1523", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {hint && <p style={{ fontSize: "12.5px", color: "#7c6f96", margin: "8px 0 0" }}>{hint}</p>}
    </Card>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
      }}
    >
      {content}
    </button>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "10px 0", borderBottom: "1px solid var(--purple-50)" }}>
      <span style={{ fontSize: "12.5px", color: "#9d8db8" }}>{label}</span>
      <span style={{ fontSize: "13px", color: value ? "#1a1523" : "#c4b8d8", textAlign: "right" }}>{value || "Not provided"}</span>
    </div>
  );
}

function VehicleItem({ vehicle }) {
  return (
    <div style={{
      border: "1px solid var(--purple-100)",
      background: "var(--purple-50)",
      borderRadius: "10px",
      padding: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1523", margin: 0 }}>
            {vehicle.make} {vehicle.model}
          </p>
          <p style={{ fontSize: "12px", color: "#7c6f96", margin: "3px 0 0" }}>
            {vehicle.year || "Year not set"}{vehicle.color ? ` - ${vehicle.color}` : ""}
          </p>
        </div>
        <Badge color="purple">{vehicle.vehicleNumber || "No plate"}</Badge>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [unpaidSummary, setUnpaidSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoginError = (error) => /log\s?in|logged\s?in/i.test(error?.message || "");

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const [profileData, serviceData, purchaseData, unpaidData] = await Promise.all([
          customerProfileApi.getProfile(),
          customerProfileApi.getServiceHistory().catch(() => []),
          customerProfileApi.getPurchaseHistory().catch(() => []),
          customerProfileApi.getUnpaidInvoices().catch(() => null),
        ]);

        if (!alive) return;
        setProfile(profileData);
        setServiceHistory(Array.isArray(serviceData) ? serviceData : []);
        setPurchaseHistory(Array.isArray(purchaseData) ? purchaseData : []);
        setUnpaidSummary(unpaidData);

        if (profileData && (!user?.fullName || user.fullName !== profileData.fullName)) {
          login({ ...user, ...profileData, role: "Customer" });
        }
      } catch (e) {
        if (!alive) return;
        if (user?.role === "Customer" && isLoginError(e)) return;
        toast.error(e.message || "Could not load your dashboard details.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();
    return () => { alive = false; };
  }, []);

  const customer = profile || user || {};
  const vehicles = useMemo(() => profile?.vehicles || [], [profile]);
  const goTo = (path) => navigate(path);

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title={`Welcome, ${customer.fullName || "Customer"}`}
        subtitle="Your vehicles, service activity, and purchase history in one place."
        action={
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => goTo("/customer/history")}>View history</Button>
            <Button variant="secondary" onClick={() => goTo("/customer/reviews")}>Leave a review</Button>
            <Button onClick={() => goTo("/customer/appointments")}>Book appointment</Button>
          </div>
        }
      />

      {unpaidSummary && unpaidSummary.unpaidCount > 0 && (
        <Card style={{
          padding: "16px 18px",
          border: "1px solid #fcd34d",
          background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
            <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#92400e" }}>
                You have {unpaidSummary.unpaidCount} outstanding invoice{unpaidSummary.unpaidCount === 1 ? "" : "s"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#a16207" }}>
                Outstanding balance: Rs. {Number(unpaidSummary.totalOutstanding).toLocaleString()}
                {unpaidSummary.overdueCount > 0 && (
                  <> · {unpaidSummary.overdueCount} overdue (please pay promptly)</>
                )}
              </p>
            </div>
            <Button onClick={() => goTo("/customer/history?tab=invoices")} style={{ flexShrink: 0 }}>
              View invoices
            </Button>
          </div>
        </Card>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}
      >
        <StatCard label="Vehicles" value={vehicles.length} hint="Registered to your profile" onClick={() => goTo("/customer/vehicles")} />
        <StatCard label="Services" value={serviceHistory.length} hint="View service history" onClick={() => goTo("/customer/history?tab=services")} />
        <StatCard label="Purchases" value={purchaseHistory.length} hint="View previous purchases" onClick={() => goTo("/customer/history?tab=purchases")} />
        <StatCard
          label="Outstanding"
          value={unpaidSummary?.unpaidCount ?? 0}
          hint="Invoices awaiting payment clearance"
          onClick={() => goTo("/customer/history?tab=invoices")}
        />
      </motion.section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
        <Card style={{ padding: "18px", alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
              Profile
            </p>
            <Button variant="secondary" onClick={() => goTo("/customer/profile")} style={{ padding: "6px 10px", fontSize: "12px" }}>
              <User size={14} strokeWidth={2.2} />
              Manage
            </Button>
          </div>
          <InfoLine label="Email" value={customer.email} />
          <InfoLine label="Phone" value={customer.phone} />
          <InfoLine label="Address" value={customer.address} />
          <InfoLine
            label="Customer since"
            value={customer.registeredAt ? new Date(customer.registeredAt).toLocaleDateString() : ""}
          />
        </Card>

        <Card style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
                Vehicles
              </p>
              <Badge color="purple">{vehicles.length}</Badge>
            </div>
            <Button onClick={() => goTo("/customer/vehicles")} style={{ padding: "6px 10px", fontSize: "12px" }}>
              <Plus size={14} strokeWidth={2.2} />
              Manage
            </Button>
          </div>

          {vehicles.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              {vehicles.slice(0, 4).map((vehicle) => (
                <VehicleItem key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "34px 14px", textAlign: "center", color: "#9d8db8", fontSize: "13px" }}>
              No vehicles are linked to your profile yet.
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
