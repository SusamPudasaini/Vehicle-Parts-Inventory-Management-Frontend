import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { customerPartsApi, customerProfileApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Spinner } from "../../components/ui";

const CATEGORY_OPTIONS = ["All"];

const STATUS_COLORS = {
  Pending: "yellow",
  Approved: "green",
  Rejected: "red",
};

export default function CustomerParts() {
  const { user } = useAuth();
  const [parts, setParts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [checkoutResult, setCheckoutResult] = useState(null);

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogData, ordersData, historyData] = await Promise.all([
        customerPartsApi.getCatalog(),
        customerPartsApi.getOrders(),
        customerProfileApi.getPurchaseHistory().catch(() => []),
      ]);

      setParts(Array.isArray(catalogData) ? catalogData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setPurchaseHistory(Array.isArray(historyData) ? historyData : []);
    } catch (e) {
      toast.error(e.message || "Failed to load parts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryOptions = useMemo(() => {
    const dynamicCategories = Array.from(new Set(parts.map((part) => part.category).filter(Boolean))).sort();
    return [...CATEGORY_OPTIONS, ...dynamicCategories];
  }, [parts]);

  const filteredParts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return parts.filter((part) => {
      const matchesCategory = category === "All" || part.category === category;
      const matchesSearch = !query
        || part.name.toLowerCase().includes(query)
        || part.partNumber.toLowerCase().includes(query)
        || part.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, parts, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0),
    [cart]
  );

  const setQuantity = (partId, value) => {
    setQuantities((current) => ({
      ...current,
      [partId]: value,
    }));
  };

  const addToCart = (part) => {
    const requestedQuantity = Number(quantities[part.id] || 1);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      toast.error("Enter a valid quantity.");
      return;
    }

    const existingQuantity = cart.find((item) => item.id === part.id)?.quantity || 0;
    if (requestedQuantity + existingQuantity > part.stockQuantity) {
      toast.error(`Only ${part.stockQuantity} unit(s) of ${part.name} are currently available.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === part.id);
      if (existing) {
        return current.map((item) =>
          item.id === part.id
            ? { ...item, quantity: item.quantity + requestedQuantity }
            : item
        );
      }

      return [
        ...current,
        {
          id: part.id,
          name: part.name,
          partNumber: part.partNumber,
          sellingPrice: part.sellingPrice,
          quantity: requestedQuantity,
        },
      ];
    });

    setQuantities((current) => ({ ...current, [part.id]: 1 }));
    toast.success(`${part.name} added to your request list.`);
  };

  const updateCartQuantity = (partId, value) => {
    const nextQuantity = Number(value);
    const part = parts.find((entry) => entry.id === partId);

    if (!part) return;

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      setCart((current) => current.filter((item) => item.id !== partId));
      return;
    }

    if (nextQuantity > part.stockQuantity) {
      toast.error(`Only ${part.stockQuantity} unit(s) of ${part.name} are currently available.`);
      return;
    }

    setCart((current) => current.map((item) => (
      item.id === partId
        ? { ...item, quantity: nextQuantity }
        : item
    )));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Add at least one part to your request list.");
      return;
    }

    setSaving(true);
    try {
      const result = await customerPartsApi.checkout(
        cart.map((item) => ({ partId: item.id, quantity: item.quantity }))
      );

      setCheckoutResult(result);
      setCart([]);
      toast.success(`Request #${result.orderId} submitted. Staff will confirm before invoicing.`);
      await loadData();
    } catch (e) {
      toast.error(e.message || "Could not submit the purchase request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Purchase Parts"
        subtitle="Search parts, review price and availability, then submit a request for staff approval and invoice confirmation."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(300px, 0.9fr)", gap: "18px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Card style={{ padding: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px", gap: "12px" }}>
              <Input
                label="Search parts"
                placeholder="Search by part name, number, or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
            </div>
          </Card>

          <div style={{ display: "grid", gap: "12px" }}>
            {filteredParts.length === 0 ? (
              <Card>
                <EmptyState
                  title="No parts found"
                  description="Try a different search or category filter."
                />
              </Card>
            ) : (
              filteredParts.map((part) => (
                <Card key={part.id} style={{ padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start" }}>
                    <div style={{ display: "grid", gap: "8px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1a1523" }}>
                          {part.name}
                        </h3>
                        <Badge color="purple">{part.category}</Badge>
                        <Badge color={part.isAvailable ? "green" : "red"}>
                          {part.isAvailable ? `${part.stockQuantity} in stock` : "Out of stock"}
                        </Badge>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8", fontFamily: "'DM Mono', monospace" }}>
                        {part.partNumber}
                      </p>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6d5d8a", lineHeight: 1.6 }}>
                        {part.description || "No description available."}
                      </p>
                    </div>

                    <div style={{ minWidth: "220px", display: "grid", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", color: "#9d8db8" }}>Price</span>
                        <strong style={{ fontSize: "18px", color: "#1a1523" }}>
                          Rs. {Number(part.sellingPrice).toLocaleString()}
                        </strong>
                      </div>
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        max={part.stockQuantity}
                        value={quantities[part.id] || 1}
                        onChange={(e) => setQuantity(part.id, e.target.value)}
                        disabled={!part.isAvailable}
                      />
                      <Button onClick={() => addToCart(part)} disabled={!part.isAvailable}>
                        Add to request purchase
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Card style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
                  Request Purchase
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6d5d8a" }}>
                  {cart.length} item{cart.length === 1 ? "" : "s"} selected
                </p>
              </div>
              <Badge color="purple">Rs. {cartTotal.toLocaleString()}</Badge>
            </div>

            {cart.length === 0 ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#9d8db8", lineHeight: 1.6 }}>
                Add parts from the catalog to prepare your purchase request.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "grid", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#1a1523" }}>{item.name}</p>
                        <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#9d8db8", fontFamily: "'DM Mono', monospace" }}>{item.partNumber}</p>
                      </div>
                      <Button variant="ghost" onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))} style={{ padding: "4px 8px" }}>
                        Remove
                      </Button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "10px", alignItems: "end" }}>
                      <Input
                        label="Qty"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.id, e.target.value)}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#9d8db8" }}>Line total</span>
                        <strong style={{ fontSize: "14px", color: "#1a1523" }}>
                          Rs. {(item.quantity * item.sellingPrice).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <Button onClick={handleCheckout} disabled={saving || cart.length === 0} style={{ flex: 1 }}>
                {saving ? "Submitting..." : "Submit for staff approval"}
              </Button>
              <Button variant="secondary" onClick={() => setCart([])} disabled={saving || cart.length === 0}>
                Clear
              </Button>
            </div>
          </Card>

          {checkoutResult && (
            <Card style={{ padding: "18px" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
                Latest Request
              </p>
              <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                <InfoRow label="Request ID" value={`#${checkoutResult.orderId}`} />
                <InfoRow label="Status" value={checkoutResult.status} />
                <InfoRow label="Total" value={`Rs. ${Number(checkoutResult.totalAmount).toLocaleString()}`} />
                <InfoRow label="Submitted at" value={new Date(checkoutResult.requestedAt).toLocaleString()} />
              </div>
            </Card>
          )}

          <Card style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
                Submitted Requests
              </p>
              <Badge color="purple">{orders.length}</Badge>
            </div>

            {orders.length === 0 ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#9d8db8" }}>
                No purchase requests submitted yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {orders.slice(0, 6).map((order) => (
                  <div key={order.id} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "grid", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <strong style={{ fontSize: "13.5px", color: "#1a1523" }}>Request #{order.id}</strong>
                      <Badge color={STATUS_COLORS[order.status] || "gray"}>{order.status}</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#7c6f96" }}>
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} · Rs. {Number(order.totalAmount).toLocaleString()}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8" }}>
                      Submitted on {new Date(order.requestedAtUtc).toLocaleString()}
                    </p>
                    {order.invoiceNumber && (
                      <p style={{ margin: 0, fontSize: "12px", color: "#15803d" }}>
                        Invoice: {order.invoiceNumber}
                      </p>
                    )}
                    {order.staffNotes && (
                      <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8" }}>
                        Staff note: {order.staffNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
                Completed Purchases
              </p>
              <Badge color="purple">{purchaseHistory.length}</Badge>
            </div>

            {purchaseHistory.length === 0 ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#9d8db8" }}>
                Approved purchases will appear here.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {purchaseHistory.slice(0, 6).map((entry) => (
                  <div key={entry.id} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "grid", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <strong style={{ fontSize: "13.5px", color: "#1a1523" }}>{entry.partName}</strong>
                      <Badge color="green">Rs. {Number(entry.totalPrice).toLocaleString()}</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#7c6f96" }}>
                      Invoice {entry.invoiceNumber}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8" }}>
                      Qty {entry.quantity} x Rs. {Number(entry.unitPrice).toLocaleString()} on {new Date(entry.purchasedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ fontSize: "12.5px", color: "#9d8db8" }}>{label}</span>
      <span style={{ fontSize: "12.5px", color: "#1a1523", textAlign: "right" }}>{value}</span>
    </div>
  );
}
