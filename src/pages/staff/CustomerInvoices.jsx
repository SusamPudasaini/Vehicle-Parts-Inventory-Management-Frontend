import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerInvoiceApi } from "../../services/api";
import { Badge, Button, Card, PageHeader, Select, Spinner, Table, TD, TR } from "../../components/ui";

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("submitted");
  const [saving, setSaving] = useState(false);
  const fileBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

  const load = async () => {
    setLoading(true);
    try {
      const data = await customerInvoiceApi.getAll(filter === "unpaid");
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const filteredInvoices = useMemo(() => {
    if (filter === "submitted") {
      return invoices.filter((invoice) => invoice.paymentStatus === "PaymentSubmitted");
    }
    return invoices;
  }, [filter, invoices]);

  const totalOutstanding = useMemo(
    () => invoices
      .filter((invoice) => invoice.paymentStatus !== "Paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0),
    [invoices]
  );

  const submittedCount = useMemo(
    () => invoices.filter((invoice) => invoice.paymentStatus === "PaymentSubmitted").length,
    [invoices]
  );

  const markPaid = async (id) => {
    setSaving(true);
    try {
      await customerInvoiceApi.markPaid(id);
      toast.success("Payment approved and invoice marked as paid.");
      await load();
    } catch (e) {
      toast.error(e.message || "Could not update invoice.");
    } finally {
      setSaving(false);
    }
  };

  const sendReminders = async () => {
    setSaving(true);
    try {
      const result = await customerInvoiceApi.sendReminders();
      toast.success(result?.message || "Reminders sent.");
    } catch (e) {
      toast.error(e.message || "Could not send reminders.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader
        title="Customer Invoices"
        subtitle="Review submitted payment statements, finalize paid invoices, and track outstanding balances."
        action={
          <Button variant="secondary" onClick={sendReminders} disabled={saving}>
            Send overdue reminders
          </Button>
        }
      />

      <Card style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="submitted">Payment submitted</option>
          <option value="unpaid">Unpaid only</option>
          <option value="all">All invoices</option>
        </Select>
        <Badge color="yellow">Outstanding: Rs. {totalOutstanding.toLocaleString()}</Badge>
        <Badge color="blue">{submittedCount} awaiting payment approval</Badge>
        <Badge color="purple">{filteredInvoices.length} shown</Badge>
      </Card>

      <Card>
        <Table headers={["Customer", "Invoice", "Type", "Amount", "Due", "Status", "Actions"]}>
          {filteredInvoices.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#9d8db8" }}>
                No invoices match this filter.
              </td>
            </tr>
          ) : (
            filteredInvoices.map((inv) => (
              <TR key={inv.id}>
                <TD>
                  <Link to={`/staff/customers/${inv.customerId}`} style={{ color: "var(--purple-700)", textDecoration: "none" }}>
                    {inv.customerName}
                  </Link>
                </TD>
                <TD mono>{inv.invoiceNumber}</TD>
                <TD>{inv.type}</TD>
                <TD>Rs. {Number(inv.amount).toLocaleString()}</TD>
                <TD muted>{new Date(inv.dueDateUtc).toLocaleDateString()}</TD>
                <TD>
                  <Badge color={
                    inv.paymentStatus === "Paid"
                      ? "green"
                      : inv.paymentStatus === "PaymentSubmitted"
                        ? "blue"
                        : inv.isOverdue
                          ? "red"
                          : "yellow"
                  }>
                    {inv.paymentStatus === "Paid"
                      ? "Paid"
                      : inv.paymentStatus === "PaymentSubmitted"
                        ? "Payment Submitted"
                        : inv.isOverdue
                          ? "Overdue"
                          : "Unpaid"}
                  </Badge>
                </TD>
                <TD>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
                    {inv.paymentStatementUrl && (
                      <a
                        href={`${fileBaseUrl}${inv.paymentStatementUrl}`}
                        download={inv.paymentStatementFileName || "payment-statement"}
                        style={{ fontSize: "12px", color: "var(--purple-700)", textDecoration: "none", alignSelf: "center" }}
                      >
                        {inv.paymentStatementFileName || "View statement"}
                      </a>
                    )}
                    {inv.paymentStatus === "PaymentSubmitted" && (
                      <Button
                        variant="secondary"
                        disabled={saving}
                        onClick={() => markPaid(inv.id)}
                        style={{ padding: "5px 10px", fontSize: "12px" }}
                      >
                        Final approve mark paid
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
