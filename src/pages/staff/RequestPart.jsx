import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { partRequestApi } from "../../services/api";
import { PageHeader, Button, Input, Card, Alert } from "../../components/ui";

export default function RequestPart() {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ partName: "", quantity: 1, details: "" });

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    if (!form.partName.trim()) return "Please enter the part name.";
    if (!form.quantity || parseInt(form.quantity) < 1) return "Please enter a valid quantity.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      await partRequestApi.create(customerId, { partName: form.partName, quantity: parseInt(form.quantity), details: form.details });
      navigate(`/staff/customers/${customerId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Request Unavailable Part" subtitle="Create a request for parts that are not in stock" />

      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Alert message={error} />

        <Card style={{ padding: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Part Name" placeholder="e.g. Front brake pads" value={form.partName} onChange={setField("partName")} />
            </div>
            <Input label="Quantity" type="number" min="1" value={form.quantity} onChange={setField("quantity")} />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Details</label>
              <textarea value={form.details} onChange={setField("details")} placeholder="Optional details or supplier info" style={{ width: "100%", minHeight: "90px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Submitting…" : "Submit Request"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
