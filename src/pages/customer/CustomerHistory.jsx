import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FileText, Package, Wrench } from "lucide-react";
import {
  appointmentApi,
  customerInvoiceApi,
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
  const [billingInvoices, setBillingInvoices] = useState([]);

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

        const [purchases, services, ordersData, apptData, invoiceData] = await Promise.all([
          customerProfileApi.getPurchaseHistory().catch(() => []),
          customerProfileApi.getServiceHistory().catch(() => []),
          customerPartsApi.getOrders().catch(() => []),
          customerId
            ? appointmentApi.getByCustomer(customerId).catch(() => [])
            : Promise.resolve([]),
          customerProfileApi.getInvoices().catch(() => []),
        ]);

        if (!alive) return;
        setPurchaseHistory(Array.isArray(purchases) ? purchases : []);
        setServiceHistory(Array.isArray(services) ? services : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setAppointments(Array.isArray(apptData) ? apptData : []);
        setBillingInvoices(Array.isArray(invoiceData) ? invoiceData : []);
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

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "Pending"),
    [orders]
  );

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
        <InvoicesTab invoices={billingInvoices} pendingOrders={pendingOrders} />
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge color="purple">{entries.length}</Badge>
          <Link to="/customer/reviews" style={{ fontSize: "12px", color: "var(--purple-600)", textDecoration: "none" }}>
            Leave a review
          </Link>
        </div>
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

function InvoicesTab({ invoices, pendingOrders }) {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submittingInvoiceId, setSubmittingInvoiceId] = useState(null);
  const [localInvoices, setLocalInvoices] = useState(invoices);
  const fileBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

  useEffect(() => {
    setLocalInvoices(invoices);
  }, [invoices]);

  const hasContent = invoices.length > 0 || pendingOrders.length > 0;

  if (!hasContent) {
    return (
      <EmptyState
        title="No invoices yet"
        description="Invoices are emailed when staff approves parts orders or completes a service."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {pendingOrders.length > 0 && (
        <Card style={{ padding: "18px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
            Awaiting approval
          </p>
          {pendingOrders.map((order) => (
            <p key={order.id} style={{ margin: "0 0 6px", fontSize: "13px", color: "#6d5d8a" }}>
              Request #{order.id} · {formatMoney(order.totalAmount)} — not yet invoiced
            </p>
          ))}
        </Card>
      )}
      {localInvoices.map((invoice) => (
        <Card key={invoice.id} style={{ padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
                {invoice.type} invoice
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "15px", fontWeight: 600, color: "#1a1523" }}>
                {invoice.invoiceNumber}
              </p>
              {invoice.description && (
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#7c6f96" }}>
                  For: {invoice.description}
                </p>
              )}
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9d8db8" }}>
                Issued {formatDate(invoice.issuedAtUtc)} · Due {formatDate(invoice.dueDateUtc)}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
              <Badge color={
                invoice.paymentStatus === "Paid"
                  ? "green"
                  : invoice.paymentStatus === "PaymentSubmitted"
                    ? "blue"
                    : invoice.isOverdue
                      ? "red"
                      : "yellow"
              }>
                {invoice.paymentStatus === "Paid"
                  ? "Paid"
                  : invoice.paymentStatus === "PaymentSubmitted"
                    ? "Payment Submitted"
                    : invoice.isOverdue
                      ? "Overdue"
                      : "Unpaid"}
              </Badge>
              <strong style={{ fontSize: "15px", color: "#1a1523" }}>
                {formatMoney(invoice.amount)}
              </strong>
            </div>
          </div>

          {invoice.items?.length > 0 ? (
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
          ) : null}
          {invoice.paymentStatementUrl && (
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#6d5d8a" }}>
              Payment statement:
              {" "}
              <a
                href={`${fileBaseUrl}${invoice.paymentStatementUrl}`}
                download={invoice.paymentStatementFileName || "payment-statement"}
                style={{ color: "var(--purple-600)", textDecoration: "none" }}
              >
                {invoice.paymentStatementFileName || "View attachment"}
              </a>
            </p>
          )}
          {invoice.paymentStatus === "Unpaid" && (
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--purple-50)", display: "grid", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#6d5d8a" }}>
                Attach your payment statement and submit it for staff approval.
              </p>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFiles((current) => ({
                  ...current,
                  [invoice.id]: e.target.files?.[0] || null,
                }))}
                style={{ fontSize: "12.5px", color: "#4c3d6b" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={async () => {
                    const file = selectedFiles[invoice.id];
                    if (!file) {
                      toast.error("Please attach a payment statement first.");
                      return;
                    }

                    const formData = new FormData();
                    formData.append("paymentStatement", file);

                    setSubmittingInvoiceId(invoice.id);
                    try {
                      const result = await customerInvoiceApi.submitPayment(invoice.id, formData);
                      setLocalInvoices((current) => current.map((entry) => (
                        entry.id === invoice.id ? result.invoice : entry
                      )));
                      toast.success(result.message || "Payment submitted for review.");
                    } catch (e) {
                      toast.error(e.message || "Could not submit payment statement.");
                    } finally {
                      setSubmittingInvoiceId(null);
                    }
                  }}
                  disabled={submittingInvoiceId === invoice.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--purple-600)",
                    color: "white",
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: "inherit",
                    cursor: submittingInvoiceId === invoice.id ? "not-allowed" : "pointer",
                    opacity: submittingInvoiceId === invoice.id ? 0.6 : 1,
                  }}
                >
                  {submittingInvoiceId === invoice.id ? "Submitting..." : "Attach statement and mark paid"}
                </button>
              </div>
            </div>
          )}
          {invoice.paymentStatus === "PaymentSubmitted" && (
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#1d4ed8" }}>
              Payment statement submitted{invoice.paymentSubmittedAtUtc ? ` on ${formatDate(invoice.paymentSubmittedAtUtc)}` : ""}. Waiting for staff confirmation.
            </p>
          )}
          {invoice.paymentStatus !== "Paid" && invoice.isOverdue && (
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "#b45309" }}>
              This balance is overdue. Please contact us to arrange payment.
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
