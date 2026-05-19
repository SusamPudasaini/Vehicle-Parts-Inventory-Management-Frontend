import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { appointmentApi } from "../../services/api";
import { PageHeader, Button, Input, Card } from "../../components/ui";

export default function BookAppointment() {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: "", time: "", serviceType: "", notes: "" });
  const today = new Date();
  const minDate = today.toISOString().slice(0, 10);

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    if (!form.date) return "Please select a date.";
    if (!form.time) return "Please select a time.";
    if (!form.serviceType.trim()) return "Please enter a service type.";
    const selected = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(selected.getTime())) return "Please enter a valid date and time.";
    if (selected < new Date()) return "Appointment date/time cannot be in the past.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      await appointmentApi.create({
        customerId: Number(customerId),
        appointmentDateTime: `${form.date}T${form.time}`,
        serviceType: form.serviceType,
        notes: form.notes,
      });
      toast.success("Appointment booked successfully.");
      navigate(`/staff/customers/${customerId}`);
    } catch (e) {
      toast.error(e.message || "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Book Appointment" subtitle="Schedule an appointment for the customer" />

      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Card style={{ padding: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Input label="Date" type="date" min={minDate} value={form.date} onChange={setField("date")} />
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
            {loading ? "Booking..." : "Book Appointment"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </>
  );
}

