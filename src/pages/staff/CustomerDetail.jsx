import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { customerApi, reviewApi } from "../../services/api";
import { Button, Badge, Card, Spinner } from "../../components/ui";

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "10.5px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
        {label}
      </span>
      <span style={{ fontSize: "13.5px", color: value ? "#1a1523" : "#c4b8d8" }}>{value || "—"}</span>
    </div>
  );
}

function VehicleCard({ vehicle }) {
  return (
    <div style={{
      background: "var(--purple-50)", borderRadius: "10px",
      padding: "14px", border: "1px solid var(--purple-100)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontWeight: "600", fontSize: "13.5px", color: "#1a1523", margin: 0 }}>
            {vehicle.make} {vehicle.model}
          </p>
          <p style={{ fontSize: "12px", color: "#9d8db8", margin: "2px 0 0" }}>{vehicle.year}</p>
        </div>
        <Badge color="purple">{vehicle.vehicleNumber}</Badge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "#6d5d8a" }}>🎨 {vehicle.color || "Not specified"}</span>
        <span style={{ fontSize: "12px", color: "#9d8db8" }}>ID: {vehicle.id}</span>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      customerApi.getById(id),
      reviewApi.getByCustomer(id).catch(() => []),
    ])
      .then(([customerData, reviewData]) => {
        setCustomer(customerData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (notFound) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "40px", marginBottom: "14px" }}>🔍</div>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1a1523", margin: "0 0 4px" }}>Customer not found</h2>
        <p style={{ fontSize: "13px", color: "#9d8db8", margin: "0 0 16px" }}>No customer with ID {id}.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "none", border: "none", cursor: "pointer",
          fontSize: "13px", color: "#9d8db8", fontFamily: "inherit",
          padding: "0", marginBottom: "24px",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--purple-700)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#9d8db8"; }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
        Back
      </button>

      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--purple-600), var(--accent))",
          color: "white", fontSize: "20px", fontWeight: "600",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {customer.fullName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#1a1523", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
            {customer.fullName}
          </h1>
          <p style={{ fontSize: "12.5px", color: "#9d8db8", margin: 0 }}>
            Customer #{customer.id} · Registered {new Date(customer.registeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "16px" }}>
        {/* Contact */}
        <Card style={{ padding: "18px", alignSelf: "start" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: "0 0 14px" }}>
            Contact
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Phone" value={customer.phone} />
            <InfoRow label="Address" value={customer.address} />
          </div>

        </Card>

        {/* Vehicles */}
        <Card style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
              Vehicles ({customer.vehicles?.length || 0})
            </p>
          </div>
          {customer.vehicles?.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {customer.vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#9d8db8", textAlign: "center", padding: "24px 0", margin: 0 }}>
              No vehicles registered.
            </p>
          )}
        </Card>
      </div>

      <Card style={{ padding: "18px", marginTop: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
            Reviews & feedback ({reviews.length})
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate(`/staff/customers/${id}/review-service`)}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Record review
          </Button>
        </div>

        {reviews.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#9d8db8", margin: 0 }}>
            No reviews submitted for this customer yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {reviews.map((review) => (
              <div
                key={review.reviewId}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "12px",
                  display: "grid",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#1a1523" }}>
                      {review.serviceType || "Service"}
                    </p>
                    {review.serviceDate && (
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9d8db8" }}>
                        {new Date(review.serviceDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f59e0b" }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} fill={n <= review.rating ? "currentColor" : "none"} strokeWidth={1.8} />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ margin: 0, fontSize: "13px", color: "#6d5d8a" }}>{review.comment}</p>
                )}
                <p style={{ margin: 0, fontSize: "11.5px", color: "#9d8db8" }}>
                  {new Date(review.createdAtUtc).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
