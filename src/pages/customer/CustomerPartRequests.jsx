import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { partRequestApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Badge, Button, Card, Input, PageHeader, Spinner } from "../../components/ui";

const STATUS_LABELS = {
  0: "Pending",
  1: "Ordered",
  2: "Available",
  3: "Cancelled",
};

const STATUS_COLORS = {
  0: "yellow",
  1: "blue",
  2: "green",
  3: "red",
};

export default function CustomerPartRequests() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ partName: "", quantity: 1, vehicleNumber: "", description: "" });

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await partRequestApi.getMine();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || "Failed to load your requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const validate = () => {
    if (!form.partName.trim()) return "Please enter the part name.";
    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty < 1) return "Please enter a valid quantity.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      await partRequestApi.create({
        partName: form.partName,
        quantity: Number(form.quantity),
        vehicleNumber: form.vehicleNumber,
        description: form.description,
      });
      toast.success("Part request submitted.");
      setForm({ partName: "", quantity: 1, vehicleNumber: "", description: "" });
      await loadRequests();
    } catch (e) {
      toast.error(e.message || "Failed to submit part request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Request Unavailable Parts"
        subtitle="Submit a part request and track status updates when items become available."
        action={
          <Button variant="secondary" onClick={loadRequests} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Card style={{ padding: "18px", maxWidth: "640px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input label="Part name" placeholder="e.g. Front brake pads" value={form.partName} onChange={setField("partName")} />
          </div>
          <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={setField("quantity")} />
          <Input label="Vehicle number" placeholder="Optional" value={form.vehicleNumber} onChange={setField("vehicleNumber")} />
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>
              Details
            </label>
            <textarea
              value={form.description}
              onChange={setField("description")}
              placeholder="Optional notes or specifications"
              style={{ width: "100%", minHeight: "90px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
            Your requests
          </p>
          <Badge color="purple">{requests.length}</Badge>
        </div>

        {requests.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#9d8db8", margin: 0 }}>
            You have not submitted any part requests yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {requests.map((req) => (
              <div key={req.partRequestId} style={{
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "12px",
                display: "grid",
                gap: "6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1523", margin: 0 }}>
                    {req.partName}
                  </p>
                  <Badge color={STATUS_COLORS[req.status] || "gray"}>
                    {STATUS_LABELS[req.status] || "Unknown"}
                  </Badge>
                </div>
                <p style={{ fontSize: "12.5px", color: "#7c6f96", margin: 0 }}>
                  Qty: {req.quantity}{req.vehicleNumber ? ` · Vehicle: ${req.vehicleNumber}` : ""}
                </p>
                {req.description && (
                  <p style={{ fontSize: "12.5px", color: "#9d8db8", margin: 0 }}>
                    {req.description}
                  </p>
                )}
                <p style={{ fontSize: "12px", color: "#b7aacb", margin: 0 }}>
                  Submitted {new Date(req.createdAtUtc).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
