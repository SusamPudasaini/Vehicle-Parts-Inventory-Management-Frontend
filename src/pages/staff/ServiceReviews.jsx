import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { reviewApi } from "../../services/api";
import { Badge, Card, EmptyState, Input, PageHeader, Spinner, Table, TD, TR } from "../../components/ui";

function Stars({ rating }) {
  return (
    <div style={{ display: "flex", gap: "2px", color: "#f59e0b" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.8} />
      ))}
    </div>
  );
}

export default function ServiceReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    reviewApi.getAll()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((e) => toast.error(e.message || "Could not load reviews."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;

    return reviews.filter((r) =>
      r.customerName?.toLowerCase().includes(q)
      || r.serviceType?.toLowerCase().includes(q)
      || r.comment?.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Customer Reviews"
        subtitle="Feedback and ratings submitted after completed services."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "18px" }}>
        <Card style={{ padding: "16px" }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
            Total reviews
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "26px", fontWeight: 700, color: "#1a1523" }}>{reviews.length}</p>
        </Card>
        <Card style={{ padding: "16px" }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
            Average rating
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "26px", fontWeight: 700, color: "#1a1523" }}>
            {reviews.length > 0 ? `${averageRating} / 5` : "—"}
          </p>
        </Card>
      </div>

      <Card style={{ padding: "18px" }}>
        <div style={{ marginBottom: "16px", maxWidth: "320px" }}>
          <Input
            label="Search"
            placeholder="Customer, service, or comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={reviews.length === 0 ? "No reviews yet" : "No matching reviews"}
            description={
              reviews.length === 0
                ? "Customer ratings will appear here after they submit feedback for completed services."
                : "Try a different search term."
            }
          />
        ) : (
          <Table
            headers={["Customer", "Service", "Rating", "Comment", "Submitted"]}
          >
            {filtered.map((review) => (
              <TR key={review.reviewId}>
                <TD>
                  <Link
                    to={`/staff/customers/${review.customerId}`}
                    style={{ color: "var(--purple-700)", textDecoration: "none", fontWeight: 500 }}
                  >
                    {review.customerName}
                  </Link>
                </TD>
                <TD>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1a1523" }}>{review.serviceType || "—"}</p>
                  {review.serviceDate && (
                    <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#9d8db8" }}>
                      {new Date(review.serviceDate).toLocaleString()}
                    </p>
                  )}
                </TD>
                <TD>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Stars rating={review.rating} />
                    <Badge color="purple">{review.rating}/5</Badge>
                  </div>
                </TD>
                <TD muted style={{ maxWidth: "280px" }}>
                  {review.comment || "—"}
                </TD>
                <TD muted>{new Date(review.createdAtUtc).toLocaleString()}</TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
