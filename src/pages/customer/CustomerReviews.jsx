import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { customerReviewApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
} from "../../components/ui";

const RATING_LABELS = {
  1: "Very poor",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

function StarRating({ value, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            style={{
              padding: "2px",
              border: "none",
              background: "transparent",
              cursor: readOnly ? "default" : "pointer",
              color: filled ? "#f59e0b" : "#d4c4e8",
            }}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            <Star size={22} fill={filled ? "currentColor" : "none"} strokeWidth={1.8} />
          </button>
        );
      })}
      {!readOnly && (
        <span style={{ marginLeft: "8px", fontSize: "12.5px", color: "#7c6f96" }}>
          {RATING_LABELS[hover || value] || "Select a rating"}
        </span>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "14px",
        display: "grid",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1a1523" }}>
            {review.serviceType || "Service"}
          </p>
          {review.serviceDate && (
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#9d8db8" }}>
              {new Date(review.serviceDate).toLocaleString()}
            </p>
          )}
        </div>
        <Badge color="purple">{review.rating}/5</Badge>
      </div>
      <StarRating value={review.rating} readOnly />
      {review.comment && (
        <p style={{ margin: 0, fontSize: "13px", color: "#6d5d8a", lineHeight: 1.55 }}>
          {review.comment}
        </p>
      )}
      <p style={{ margin: 0, fontSize: "11.5px", color: "#9d8db8" }}>
        Submitted {new Date(review.createdAtUtc).toLocaleString()}
      </p>
    </div>
  );
}

export default function CustomerReviews() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewable, setReviewable] = useState([]);
  const [form, setForm] = useState({ appointmentId: "", rating: 5, comment: "" });

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [mine, services] = await Promise.all([
        customerReviewApi.getMine().catch(() => []),
        customerReviewApi.getReviewable().catch(() => []),
      ]);
      setReviews(Array.isArray(mine) ? mine : []);
      setReviewable(Array.isArray(services) ? services : []);
    } catch (e) {
      toast.error(e.message || "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!form.appointmentId) {
      toast.error("Select a completed service to review.");
      return;
    }

    setSaving(true);
    try {
      await customerReviewApi.create({
        appointmentId: Number(form.appointmentId),
        rating: form.rating,
        comment: form.comment.trim() || null,
      });
      toast.success("Thank you for your feedback!");
      setForm({ appointmentId: "", rating: 5, comment: "" });
      await loadData();
    } catch (e) {
      toast.error(e.message || "Could not submit review.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const serviceOptions = [
    { value: "", label: "Select a completed service…" },
    ...reviewable.map((s) => ({
      value: String(s.appointmentId),
      label: `${s.serviceType} — ${new Date(s.serviceDate).toLocaleString()}`,
    })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Reviews & Feedback"
        subtitle="Rate your service experience and share feedback with our team."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px" }}>
        <Card style={{ padding: "18px" }}>
          <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
            Submit a review
          </p>

          {reviewable.length === 0 ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#7c6f96", lineHeight: 1.6 }}>
              There are no completed services waiting for feedback right now. After staff marks an appointment as completed, you can rate it here.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              <Select
                label="Service"
                value={form.appointmentId}
                onChange={(e) => setForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
              >
                {serviceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "8px" }}>
                  Rating
                </label>
                <StarRating
                  value={form.rating}
                  onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
                />
              </div>

              <div>
                <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>
                  Comments (optional)
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us about your experience…"
                  maxLength={1000}
                  style={{
                    width: "100%",
                    minHeight: "96px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    resize: "vertical",
                  }}
                />
              </div>

              <Button onClick={handleSubmit} disabled={saving} style={{ justifySelf: "start" }}>
                {saving ? "Submitting…" : "Submit review"}
              </Button>
            </div>
          )}
        </Card>

        <Card style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
              Your reviews
            </p>
            <Badge color="purple">{reviews.length}</Badge>
          </div>

          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description="Your submitted ratings and comments will appear here."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {reviews.map((review) => (
                <ReviewCard key={review.reviewId} review={review} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
