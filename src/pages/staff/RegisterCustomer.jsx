import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../services/api";
import { PageHeader, Button, Input, Card, Alert } from "../../components/ui";

const CURRENT_YEAR = new Date().getFullYear();

function StepBadge({ n }) {
  return (
    <div style={{
      width: "24px", height: "24px", borderRadius: "50%",
      background: "var(--purple-600)", color: "white",
      fontSize: "11px", fontWeight: "700",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {n}
    </div>
  );
}

function SectionTitle({ step, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}>
      <StepBadge n={step} />
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1523", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "12.5px", color: "#9d8db8", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function RegisterCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [customer, setCustomer] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [vehicle, setVehicle] = useState({ vehicleNumber: "", make: "", model: "", year: CURRENT_YEAR, color: "" });

  const setC = (key) => (e) => setCustomer((f) => ({ ...f, [key]: e.target.value }));
  const setV = (key) => (e) => setVehicle((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (!customer.fullName.trim()) return "Customer name is required.";
    if (!customer.email.trim()) return "Email is required.";
    if (!vehicle.vehicleNumber.trim()) return "Vehicle number is required.";
    if (!vehicle.make.trim()) return "Vehicle make is required.";
    if (!vehicle.model.trim()) return "Vehicle model is required.";
    if (vehicle.year < 1900 || vehicle.year > CURRENT_YEAR + 1) return "Please enter a valid vehicle year.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      const result = await customerApi.register({
        ...customer,
        vehicle: { ...vehicle, year: parseInt(vehicle.year) }
      });
      setSuccess(true);
      setTimeout(() => navigate(`/staff/customers/${result.id}`), 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%",
          background: "var(--purple-100)", marginBottom: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px",
        }}>✓</div>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1523", margin: "0 0 4px" }}>Customer Registered!</h2>
        <p style={{ fontSize: "13px", color: "#9d8db8" }}>Redirecting to customer details…</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Register Customer"
        subtitle="Add a new customer and their vehicle to the system"
      />

      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Alert message={error} />

        <Card style={{ padding: "22px" }}>
          <SectionTitle step="1" title="Customer Information" subtitle="Personal and contact details" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Full Name" placeholder="e.g. Aarav Sharma" value={customer.fullName} onChange={setC("fullName")} />
            </div>
            <Input label="Email Address" type="email" placeholder="aarav@example.com" value={customer.email} onChange={setC("email")} />
            <Input label="Phone Number" placeholder="+977 98XXXXXXXX" value={customer.phone} onChange={setC("phone")} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Address" placeholder="Street, City" value={customer.address} onChange={setC("address")} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "22px" }}>
          <SectionTitle step="2" title="Vehicle Details" subtitle="Information about the customer's vehicle" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Vehicle / Plate Number" placeholder="e.g. BA 1 CHA 1234" value={vehicle.vehicleNumber} onChange={setV("vehicleNumber")} />
            </div>
            <Input label="Make (Brand)" placeholder="e.g. Toyota" value={vehicle.make} onChange={setV("make")} />
            <Input label="Model" placeholder="e.g. Corolla" value={vehicle.model} onChange={setV("model")} />
            <Input label="Year" type="number" min="1900" max={CURRENT_YEAR + 1} value={vehicle.year} onChange={setV("year")} />
            <Input label="Color" placeholder="e.g. White" value={vehicle.color} onChange={setV("color")} />
          </div>
        </Card>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Registering…" : "Register Customer"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
