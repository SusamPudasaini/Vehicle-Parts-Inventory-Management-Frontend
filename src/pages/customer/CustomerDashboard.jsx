import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { customerProfileApi } from "../../services/api";
import { Badge, Button, Card, Spinner } from "../../components/ui";
import BrandLogo from "../../components/BrandLogo";

function StatCard({ label, value, hint }) {
  return (
    <Card style={{ padding: "18px" }}>
      <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontSize: "28px", fontWeight: "700", color: "#1a1523", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {hint && <p style={{ fontSize: "12.5px", color: "#7c6f96", margin: "8px 0 0" }}>{hint}</p>}
    </Card>
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
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const [profileData, serviceData, purchaseData] = await Promise.all([
          customerProfileApi.getProfile(),
          customerProfileApi.getServiceHistory().catch(() => []),
          customerProfileApi.getPurchaseHistory().catch(() => []),
        ]);

        if (!alive) return;
        setProfile(profileData);
        setServiceHistory(Array.isArray(serviceData) ? serviceData : []);
        setPurchaseHistory(Array.isArray(purchaseData) ? purchaseData : []);

        if (profileData && (!user?.fullName || user.fullName !== profileData.fullName)) {
          login({ ...user, ...profileData, role: "Customer" });
        }
      } catch (e) {
        if (!alive) return;
        setNotice(e.message || "Could not load your dashboard details.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();
    return () => { alive = false; };
  }, []);

  const customer = profile || user || {};
  const vehicles = useMemo(() => profile?.vehicles || [], [profile]);

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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <header style={{
        background: "var(--purple-950)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BrandLogo size={34} subtitle="Customer Portal" />
          </div>
          <Button variant="ghost" onClick={handleLogout} style={{ color: "rgba(255,255,255,0.75)" }}>
            <LogOut size={14} strokeWidth={2.2} />
            Sign out
          </Button>
        </div>
      </header>

      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 24px 48px" }}>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", marginBottom: "28px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--purple-600), var(--accent))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {customer.fullName?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1a1523", margin: "0 0 4px" }}>
                Welcome, {customer.fullName || "Customer"}
              </h1>
              <p style={{ fontSize: "13.5px", color: "#7c6f96", margin: 0 }}>
                Your vehicles, service activity, and purchase history in one place.
              </p>
            </div>
          </div>
        </motion.section>

        {notice && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "18px" }}>
            {notice}
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "18px" }}>
          <StatCard label="Vehicles" value={vehicles.length} hint="Registered to your profile" />
          <StatCard label="Services" value={serviceHistory.length} hint="Completed service records" />
          <StatCard label="Purchases" value={purchaseHistory.length} hint="Recorded part purchases" />
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          <Card style={{ padding: "18px", alignSelf: "start" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: "0 0 8px" }}>
              Profile
            </p>
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
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
                Vehicles
              </p>
              <Badge color="purple">{vehicles.length}</Badge>
            </div>

            {vehicles.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                {vehicles.map((vehicle) => <VehicleItem key={vehicle.id} vehicle={vehicle} />)}
              </div>
            ) : (
              <div style={{ padding: "34px 14px", textAlign: "center", color: "#9d8db8", fontSize: "13px" }}>
                No vehicles are linked to your profile yet.
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
