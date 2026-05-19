import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { customerPartOrdersApi } from "../../services/api";
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner } from "../../components/ui";

const STATUS_COLORS = {
  Pending: "yellow",
  Approved: "green",
  Rejected: "red",
};

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected"];

export default function CustomerPartOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");
  const [activeOrder, setActiveOrder] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [staffNotes, setStaffNotes] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await customerPartOrdersApi.getAll();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || "Failed to load part orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "All") return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const openModal = (order, mode) => {
    setActiveOrder(order);
    setModalMode(mode);
    setStaffNotes(order?.staffNotes || "");
  };

  const closeModal = () => {
    setActiveOrder(null);
    setModalMode(null);
    setStaffNotes("");
  };

  const handleSubmit = async () => {
    if (!activeOrder || !modalMode) return;

    setSaving(true);
    try {
      if (modalMode === "approve") {
        await customerPartOrdersApi.approve(activeOrder.id, staffNotes.trim() || null);
        toast.success(`Order #${activeOrder.id} approved — unpaid invoice emailed to customer.`);
      } else {
        await customerPartOrdersApi.reject(activeOrder.id, staffNotes.trim() || null);
        toast.success(`Order #${activeOrder.id} rejected.`);
      }

      closeModal();
      await loadOrders();
    } catch (e) {
      toast.error(e.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Customer Part Orders"
        subtitle="Review customer requests, confirm stock, and send invoices only when staff approves."
        action={(
          <Button variant="secondary" onClick={loadOrders}>
            Refresh
          </Button>
        )}
      />

      <Card style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#6d5d8a" }}>Filter status</span>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </div>
        <Badge color="purple">{filteredOrders.length}</Badge>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card style={{ padding: "24px", textAlign: "center", color: "#9d8db8" }}>
          No part orders to show.
        </Card>
      ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} style={{ padding: "18px" }}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1a1523" }}>
                      Order #{order.id}
                    </h3>
                    <Badge color={STATUS_COLORS[order.status] || "gray"}>{order.status}</Badge>
                    {order.invoiceNumber && <Badge color="green">{order.invoiceNumber}</Badge>}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6d5d8a" }}>
                    {order.customerName} · {order.customerEmail}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8" }}>
                    Submitted on {new Date(order.requestedAtUtc).toLocaleString()}
                    {order.processedAtUtc ? ` · Processed on ${new Date(order.processedAtUtc).toLocaleString()}` : ""}
                  </p>
                </div>

                <div style={{ display: "grid", gap: "6px", minWidth: "170px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#9d8db8" }}>Total</span>
                    <strong style={{ color: "#1a1523" }}>Rs. {Number(order.totalAmount).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {order.status === "Pending" && (
                      <>
                        <Button onClick={() => openModal(order, "approve")} style={{ flex: 1 }}>
                          Approve
                        </Button>
                        <Button variant="secondary" onClick={() => openModal(order, "reject")} style={{ flex: 1 }}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "grid", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "13.5px", color: "#1a1523" }}>{item.partName}</strong>
                      <span style={{ fontSize: "13px", color: "#1a1523" }}>Rs. {Number(item.lineTotal).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8", fontFamily: "'DM Mono', monospace" }}>
                      {item.partNumber}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6d5d8a" }}>
                      Qty {item.quantity} x Rs. {Number(item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {order.staffNotes && (
                <div style={{ padding: "12px", borderRadius: "10px", background: "var(--purple-50)", border: "1px solid var(--purple-100)" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#6d5d8a" }}>
                    Staff note: {order.staffNotes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))
      )}

      <Modal
        open={!!activeOrder && !!modalMode}
        onClose={closeModal}
        title={modalMode === "approve" ? "Approve part order" : "Reject part order"}
      >
        <div style={{ display: "grid", gap: "14px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6d5d8a", lineHeight: 1.6 }}>
            {modalMode === "approve"
              ? "Approving this order will deduct stock, create purchase history, and email the invoice to the customer."
              : "Reject this order if the stock or request cannot be fulfilled right now."}
          </p>
          <Input
            label="Staff note (optional)"
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder={modalMode === "approve" ? "Optional note to include with the invoice" : "Optional reason for rejection"}
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving
                ? "Saving..."
                : modalMode === "approve"
                  ? "Approve and send invoice"
                  : "Reject order"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
