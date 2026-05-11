import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reviewApi } from "../../services/api";
import { PageHeader, Button, Input, Card, Alert } from "../../components/ui";

export default function ReviewService() {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ rating: 5, comments: "" });

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    const r = parseInt(form.rating);
    if (!r || r < 1 || r > 5) return "Please select a rating between 1 and 5.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      await reviewApi.create(customerId, { rating: parseInt(form.rating), comments: form.comments });
      navigate(`/staff/customers/${customerId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Review Service" subtitle="Record a customer's service feedback" />

      <div style={{ maxWidth: "620px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Alert message={error} />

        <Card style={{ padding: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Rating</label>
              <select value={form.rating} onChange={setField("rating")} style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }}>
                <option value={5}>5 — Excellent</option>
                <option value={4}>4 — Good</option>
                <option value={3}>3 — Okay</option>
                <option value={2}>2 — Poor</option>
                <option value={1}>1 — Very poor</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Comments</label>
              <textarea value={form.comments} onChange={setField("comments")} placeholder="Optional comments" style={{ width: "100%", minHeight: "90px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }} />
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Saving…" : "Save Review"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
