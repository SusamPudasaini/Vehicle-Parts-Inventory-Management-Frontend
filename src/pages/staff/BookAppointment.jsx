import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { appointmentApi } from "../../services/api";
import { PageHeader, Button, Input, Card, Alert } from "../../components/ui";

export default function BookAppointment() {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ date: "", time: "", serviceType: "", notes: "" });

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    if (!form.date) return "Please select a date.";
    if (!form.time) return "Please select a time.";
    if (!form.serviceType.trim()) return "Please enter a service type.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      await appointmentApi.create(customerId, { date: form.date, time: form.time, serviceType: form.serviceType, notes: form.notes });
      navigate(`/staff/customers/${customerId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Book Appointment" subtitle="Schedule an appointment for the customer" />

      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Alert message={error} />

        <Card style={{ padding: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Date" type="date" value={form.date} onChange={setField("date")} />
            <Input label="Time" type="time" value={form.time} onChange={setField("time")} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="Service Type" placeholder="e.g. Oil change" value={form.serviceType} onChange={setField("serviceType")} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Notes</label>
              <textarea value={form.notes} onChange={setField("notes")} placeholder="Optional notes" style={{ width: "100%", minHeight: "90px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Booking…" : "Book Appointment"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
