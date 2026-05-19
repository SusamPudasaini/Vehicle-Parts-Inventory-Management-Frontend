import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FileText, Package, Wrench } from "lucide-react";
import {
  appointmentApi,
  customerPartsApi,
  customerProfileApi,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Badge, Card, EmptyState, PageHeader, Spinner } from "../../components/ui";

const TABS = [
  { id: "purchases", label: "Previous Purchases", icon: Package },
  { id: "services", label: "Service History", icon: Wrench },
  { id: "invoices", label: "Invoices & Payments", icon: FileText },
];

const PAYMENT_STATUS = {
  Approved: { label: "Paid", color: "green" },
  Pending: { label: "Awaiting approval", color: "yellow" },
  Rejected: { label: "Not billed", color: "red" },
};

function formatMoney(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function CustomerHistory() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "purchases";

  const [loading, setLoading] = useState(true);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  useEffect(() => {
    let alive = true;

    async function loadHistory() {
      setLoading(true);
      try {
        const profile = await customerProfileApi.getProfile();
        const customerId = profile?.id;

        const [purchases, services, ordersData, apptData] = await Promise.all([
          customerProfileApi.getPurchaseHistory().catch(() => []),
          customerProfileApi.getServiceHistory().catch(() => []),
          customerPartsApi.getOrders().catch(() => []),
          customerId
            ? appointmentApi.getByCustomer(customerId).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (!alive) return;
        setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
        setServiceHistory(Array.isArray(services) ? services : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setAppointments(Array.isArray(apptData) ? apptData : []);
      } catch (e) {
        if (alive) toast.error(e.message || "Could not load your history.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadHistory();
    return () => { alive = false; };
  }, []);

  const completedAppointments = useMemo(
    () => appointments.filter((a) => Number(a.status) === 2),
    [appointments]
  );

  const serviceEntries = useMemo(() => {
    const records = serviceHistory.map((entry) => ({
      key: `service-${entry.id}`,
      type: "record",
      serviceType: entry.serviceType,
      description: entry.description,
      vehicleNumber: entry.vehicleNumber,
      cost: entry.cost,
      status: entry.status,
      date: entry.serviceDate,
    }));

    const fromAppointments = completedAppointments.map((appt) => ({
      key: `appt-${appt.appointmentId || appt.id}`,
      type: "appointment",
      serviceType: appt.serviceType,
      description: appt.notes || "Completed appointment",
      vehicleNumber: "",
      cost: null,
      status: "Completed",
      date: appt.appointmentDateTime,
    }));

    return [...records, ...fromAppointments].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [serviceHistory, completedAppointments]);

  const invoices = useMemo(() => {
    const byInvoice = new Map();

    orders.forEach((order) => {
      const payment = PAYMENT_STATUS[order.status] || { label: order.status, color: "gray" };
      const entry = {
        id: order.id,
        invoiceNumber: order.invoiceNumber || `Request #${order.id}`,
        status: order.status,
        paymentLabel: payment.label,
        paymentColor: payment.color,
        totalAmount: order.totalAmount,
        date: order.processedAtUtc || order.requestedAtUtc,
        items: [...(order.items || [])],
        isRequest: !order.invoiceNumber,
      };

      const groupKey = order.invoiceNumber || `pending-${order.id}`;
      byInvoice.set(groupKey, entry);
    });

    purchaseHistory.forEach((line) => {
      const key = line.invoiceNumber || `purchase-${line.id}`;
      if (!byInvoice.has(key)) {
        byInvoice.set(key, {
          id: line.id,
          invoiceNumber: line.invoiceNumber,
          status: "Approved",
          paymentLabel: "Paid",
          paymentColor: "green",
          totalAmount: 0,
          date: line.purchasedAt,
          items: [],
          isRequest: false,
        });
      }
      const group = byInvoice.get(key);
      group.items.push({
        partName: line.partName,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.totalPrice,
      });
      group.totalAmount += Number(line.totalPrice || 0);
      if (new Date(line.purchasedAt) > new Date(group.date)) {
        group.date = line.purchasedAt;
      }
    });

    return Array.from(byInvoice.values()).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [orders, purchaseHistory]);

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="View History"
        subtitle="Review your past part purchases, completed services, and invoices."
      />

      <div
        role="tablist"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "4px",
          background: "var(--purple-50)",
          borderRadius: "10px",
          border: "1px solid var(--purple-100)",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "white" : "#6d5d8a",
                background: isActive ? "var(--purple-600)" : "transparent",
                boxShadow: isActive ? "0 1px 3px rgba(109,40,217,0.25)" : "none",
              }}
            >
              <Icon size={15} strokeWidth={2.1} />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "purchases" && (
        <PurchasesTab entries={purchaseHistory} orderCount={orders.length} />
      )}

      {activeTab === "services" && (
        <ServicesTab entries={serviceEntries} />
      )}

      {activeTab === "invoices" && (
        <InvoicesTab invoices={invoices} />
      )}
    </div>
  );
}

function PurchasesTab({ entries, orderCount }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No purchases yet"
        description={
          orderCount > 0
            ? "You have submitted purchase requests. Approved items will appear here after staff approval."
            : "Browse parts and submit a purchase request. Completed purchases will be listed here."
        }
      />
    );
  }

  return (
    <Card style={{ padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
          Previous Purchases
        </p>
        <Badge color="purple">{entries.length}</Badge>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px",
              display: "grid",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <strong style={{ fontSize: "14px", color: "#1a1523" }}>{entry.partName}</strong>
              <Badge color="green">{formatMoney(entry.totalPrice)}</Badge>
            </div>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#7c6f96" }}>
              Invoice {entry.invoiceNumber}
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#9d8db8" }}>
              Qty {entry.quantity} × {formatMoney(entry.unitPrice)} · {formatDate(entry.purchasedAt)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ServicesTab({ entries }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No service history yet"
        description="Completed services and finished appointments will appear here."
      />
    );
  }

  return (
    <Card style={{ padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
          Service History
        </p>
        <Badge color="purple">{entries.length}</Badge>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {entries.map((entry) => (
          <div
            key={entry.key}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px",
              display: "grid",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <strong style={{ fontSize: "14px", color: "#1a1523" }}>{entry.serviceType}</strong>
              <Badge color={entry.type === "appointment" ? "blue" : "purple"}>
                {entry.status}
              </Badge>
            </div>
            {entry.description && (
              <p style={{ margin: 0, fontSize: "12.5px", color: "#7c6f96" }}>{entry.description}</p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#9d8db8" }}>
              {entry.vehicleNumber && <span>Vehicle: {entry.vehicleNumber}</span>}
              {entry.cost != null && entry.cost > 0 && <span>Cost: {formatMoney(entry.cost)}</span>}
              <span>{formatDate(entry.date)}</span>
              {entry.type === "appointment" && (
                <span style={{ color: "#6d5d8a" }}>From appointment</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InvoicesTab({ invoices }) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No invoices yet"
        description="Invoices are issued when your part purchase requests are approved by staff."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {invoices.map((invoice) => (
        <Card key={`${invoice.invoiceNumber}-${invoice.id}`} style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
                {invoice.isRequest ? "Purchase request" : "Invoice"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 600, color: "#1a1523" }}>
                {invoice.invoiceNumber}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9d8db8" }}>
                {formatDate(invoice.date)}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <Badge color={invoice.paymentColor}>{invoice.paymentLabel}</Badge>
              <strong style={{ fontSize: "15px", color: "#1a1523" }}>
                {formatMoney(invoice.totalAmount)}
              </strong>
            </div>
          </div>

          {invoice.items.length > 0 ? (
            <div style={{ borderTop: "1px solid var(--purple-50)", paddingTop: "12px", display: "grid", gap: "8px" }}>
              {invoice.items.map((item, index) => (
                <div
                  key={`${item.partName || item.partNumber}-${index}`}
                  style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12.5px" }}
                >
                  <span style={{ color: "#1a1523" }}>
                    {item.partName}
                    {item.quantity != null && ` × ${item.quantity}`}
                  </span>
                  <span style={{ color: "#7c6f96" }}>
                    {formatMoney(item.lineTotal ?? (item.unitPrice * item.quantity))}
                  </span>
                </div>
              ))}
            </div>
          ) : invoice.status === "Approved" ? (
            <p style={{ margin: 0, fontSize: "12.5px", color: "#7c6f96" }}>
              Part line details are recorded in your purchase history.
            </p>
          ) : null}

          {invoice.status === "Pending" && (
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#9d8db8" }}>
              Payment is collected after staff approves your request.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}