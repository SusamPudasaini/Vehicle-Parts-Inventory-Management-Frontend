import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { appointmentApi, reviewApi } from "../../services/api";
import { PageHeader, Button, Card, Alert, Select, Spinner } from "../../components/ui";

const RATING_OPTIONS = [
  { value: 5, label: "5 — Excellent" },
  { value: 4, label: "4 — Good" },
  { value: 3, label: "3 — Okay" },
  { value: 2, label: "2 — Poor" },
  { value: 1, label: "1 — Very poor" },
];

export default function ReviewService() {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ appointmentId: "", rating: 5, comment: "" });

  const setField = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  useEffect(() => {
    appointmentApi.getByCustomer(customerId)
      .then((list) => {
        const completed = (Array.isArray(list) ? list : []).filter((a) => Number(a.status) === 2);
        setAppointments(completed);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoadingAppts(false));
  }, [customerId]);

  const validate = () => {
    const r = parseInt(form.rating, 10);
    if (!r || r < 1 || r > 5) return "Please select a rating between 1 and 5.";
    if (!form.appointmentId) return "Select a completed service.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await reviewApi.create({
        customerId: Number(customerId),
        appointmentId: Number(form.appointmentId),
        rating: parseInt(form.rating, 10),
        comment: form.comment.trim() || null,
      });
      toast.success("Review saved.");
      navigate(`/staff/customers/${customerId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAppts) return <Spinner />;

  return (
    <>
      <PageHeader title="Record Review" subtitle="Submit service feedback on behalf of a customer" />

      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Alert message={error} />

        <Card style={{ padding: "18px" }}>
          {appointments.length === 0 ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#7c6f96" }}>
              This customer has no completed appointments to review yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <Select label="Completed service" value={form.appointmentId} onChange={setField("appointmentId")}>
                <option value="">Select service…</option>
                {appointments.map((appt) => (
                  <option key={appt.appointmentId || appt.id} value={appt.appointmentId || appt.id}>
                    {appt.serviceType} — {new Date(appt.appointmentDateTime).toLocaleString()}
                  </option>
                ))}
              </Select>

              <Select label="Rating" value={form.rating} onChange={setField("rating")}>
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>
                  Comments
                </label>
                <textarea
                  value={form.comment}
                  onChange={setField("comment")}
                  placeholder="Optional feedback"
                  style={{ width: "100%", minHeight: "90px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }}
                />
              </div>
            </div>
          )}
        </Card>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={handleSubmit} disabled={loading || appointments.length === 0} style={{ flex: 1 }}>
            {loading ? "Saving…" : "Save review"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
