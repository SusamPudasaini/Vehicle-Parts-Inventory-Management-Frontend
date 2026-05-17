import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, Badge, Card, Input, Select, Modal, EmptyState, Spinner, Alert, Table, TR, TD } from "../../components/ui";

const BASE_URL = "https://localhost:7041/api";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" }, ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

function InvoiceDetail({ invoice, onClose }) {
  return (
    <Modal open={!!invoice} onClose={onClose} title={`Invoice ${invoice?.invoiceNumber}`}>
      {invoice && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#9d8db8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vendor</p>
              <p style={{ fontSize: "13.5px", fontWeight: "500", margin: 0 }}>{invoice.vendorName}</p>
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "#9d8db8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Date</p>
              <p style={{ fontSize: "13.5px", margin: 0 }}>{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
            </div>
            {invoice.notes && (
              <div style={{ gridColumn: "1/-1" }}>
                <p style={{ fontSize: "11px", color: "#9d8db8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</p>
                <p style={{ fontSize: "13px", margin: 0, color: "#4c3d6b" }}>{invoice.notes}</p>
              </div>
            )}
          </div>

          <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
            <Table headers={["Part", "Part #", "Qty", "Unit Price", "Total"]}>
              {invoice.items.map((item) => (
                <TR key={item.id}>
                  <TD style={{ fontWeight: "500" }}>{item.partName}</TD>
                  <TD muted mono>{item.partNumber}</TD>
                  <TD>{item.quantity}</TD>
                  <TD muted>Rs. {item.unitPrice.toLocaleString()}</TD>
                  <TD style={{ fontWeight: "600", color: "var(--purple-700)" }}>Rs. {item.lineTotal.toLocaleString()}</TD>
                </TR>
              ))}
            </Table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px", borderTop: "1px solid var(--border)" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#9d8db8", margin: "0 0 2px" }}>TOTAL</p>
              <p style={{ fontSize: "20px", fontWeight: "700", color: "var(--purple-700)", margin: 0 }}>
                Rs. {invoice.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CreateInvoiceModal({ open, onClose, onCreated }) {
  const [vendors, setVendors] = useState([]);
  const [parts, setParts] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ partId: "", quantity: 1, unitPrice: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      api("/vendor").then(setVendors).catch(() => {});
      api("/part").then(setParts).catch(() => {});
      setVendorId(""); setNotes(""); setItems([{ partId: "", quantity: 1, unitPrice: "" }]); setError("");
    }
  }, [open]);

  const setItem = (idx, key, val) => setItems((prev) =>
    prev.map((item, i) => i === idx ? { ...item, [key]: val } : item)
  );

  const addItem = () => setItems((prev) => [...prev, { partId: "", quantity: 1, unitPrice: "" }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0), 0);

  const handleSubmit = async () => {
    if (!vendorId) { setError("Please select a vendor."); return; }
    if (items.some((i) => !i.partId || !i.unitPrice)) { setError("All items need a part and unit price."); return; }

    setLoading(true); setError("");
    try {
      await api("/purchaseinvoice", {
        method: "POST",
        body: JSON.stringify({
          vendorId: parseInt(vendorId),
          notes,
          items: items.map((i) => ({
            partId: parseInt(i.partId),
            quantity: parseInt(i.quantity),
            unitPrice: parseFloat(i.unitPrice),
          }))
        })
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Purchase Invoice">
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Alert message={error} />

        <Select label="Vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">Select vendor…</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>

        <Input label="Notes (optional)" placeholder="e.g. Monthly restocking order" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "500", color: "#4c3d6b" }}>Items</label>
            <Button variant="ghost" onClick={addItem} style={{ fontSize: "12px", padding: "4px 10px" }}>+ Add Item</Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 32px", gap: "8px", alignItems: "end" }}>
                <div>
                  <select
                    value={item.partId}
                    onChange={(e) => {
                      const part = parts.find((p) => p.id === parseInt(e.target.value));
                      setItem(idx, "partId", e.target.value);
                      if (part) setItem(idx, "unitPrice", part.purchasePrice);
                    }}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                  >
                    <option value="">Select part…</option>
                    {parts.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>)}
                  </select>
                </div>
                <input
                  type="number" min="1" value={item.quantity}
                  onChange={(e) => setItem(idx, "quantity", e.target.value)}
                  placeholder="Qty"
                  style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                />
                <input
                  type="number" min="0" step="0.01" value={item.unitPrice}
                  onChange={(e) => setItem(idx, "unitPrice", e.target.value)}
                  placeholder="Price"
                  style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", outline: "none" }}
                />
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "16px", padding: "4px" }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {total > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--purple-700)", margin: 0 }}>
              Total: Rs. {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Creating…" : "Create Invoice"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function PurchaseInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try { setLoading(true); const data = await api("/purchaseinvoice"); setInvoices(data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  return (
    <>
      <PageHeader
        title="Purchase Invoices"
        subtitle="Record stock purchases from vendors"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New Invoice
          </Button>
        }
      />

      <Card>
        {loading ? <Spinner /> : invoices.length === 0 ? (
          <EmptyState icon="🧾" title="No invoices yet" description="Create your first purchase invoice to update stock." action={<Button onClick={() => setCreateOpen(true)}>New Invoice</Button>} />
        ) : (
          <Table headers={["Invoice #", "Vendor", "Date", "Items", "Total", ""]}>
            {invoices.map((inv) => (
              <TR key={inv.id} onClick={() => setSelected(inv)}>
                <TD mono>{inv.invoiceNumber}</TD>
                <TD style={{ fontWeight: "500" }}>{inv.vendorName}</TD>
                <TD muted>{new Date(inv.invoiceDate).toLocaleDateString()}</TD>
                <TD><Badge color="purple">{inv.items.length} item{inv.items.length !== 1 ? "s" : ""}</Badge></TD>
                <TD style={{ fontWeight: "600", color: "var(--purple-700)" }}>Rs. {inv.totalAmount.toLocaleString()}</TD>
                <TD><button onClick={() => setSelected(inv)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", fontWeight: "500", color: "var(--purple-600)", fontFamily: "inherit" }}>View →</button></TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      <InvoiceDetail invoice={selected} onClose={() => setSelected(null)} />
      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchInvoices} />
    </>
  );
}
