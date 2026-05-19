import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import {
  PageHeader, Button, Badge, Card, Input, Select,
  Modal, EmptyState, Spinner, Alert, Table, TR, TD, ActionButton
} from "../../components/ui";

const BASE_URL = "https://localhost:7041/api";

async function partsApi(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

const CATEGORIES = ["Engine", "Brakes", "Suspension", "Electrical", "Body", "Transmission", "Cooling", "Exhaust", "Other"];

function PartForm({ initial, vendors, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(() => (
    initial
      ? { ...initial, vendorId: initial.vendorId?.toString() ?? "" }
      : {
        vendorId: "",
        name: "", partNumber: "", category: "Engine", description: "",
        sellingPrice: "", purchasePrice: "", stockQuantity: "", lowStockThreshold: 10, isActive: true,
      }
  ));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setCheck = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Alert message={error} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Input label="Part Name" placeholder="e.g. Brake Pad Set" value={form.name} onChange={set("name")} required />
        <Input label="Part Number" placeholder="e.g. BP-2024-001" value={form.partNumber} onChange={set("partNumber")} required />
      </div>

      <Select label="Vendor" value={form.vendorId} onChange={set("vendorId")}>
        <option value="">Select vendor</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
        ))}
      </Select>

      <Select label="Category" value={form.category} onChange={set("category")}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>

      <Input label="Description" placeholder="Brief description of the part" value={form.description} onChange={set("description")} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Input label="Purchase Price (Rs.)" type="number" min="0" step="0.01" placeholder="0.00" value={form.purchasePrice} onChange={set("purchasePrice")} required />
        <Input label="Selling Price (Rs.)" type="number" min="0" step="0.01" placeholder="0.00" value={form.sellingPrice} onChange={set("sellingPrice")} required />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Input label="Stock Quantity" type="number" min="0" placeholder="0" value={form.stockQuantity} onChange={set("stockQuantity")} required />
        <Input label="Low Stock Alert Threshold" type="number" min="1" placeholder="10" value={form.lowStockThreshold} onChange={set("lowStockThreshold")} />
      </div>

      {initial && (
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#4c3d6b", cursor: "pointer" }}>
          <input type="checkbox" checked={form.isActive} onChange={setCheck("isActive")} />
          Active
        </label>
      )}

      <div style={{ display: "flex", gap: "10px", paddingTop: "6px" }}>
        <Button type="button" onClick={() => onSubmit({
          ...form,
          vendorId: parseInt(form.vendorId, 10),
          sellingPrice: parseFloat(form.sellingPrice) || 0,
          purchasePrice: parseFloat(form.purchasePrice) || 0,
          stockQuantity: parseInt(form.stockQuantity) || 0,
          lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        })} disabled={loading} style={{ flex: 1 }}>
          {loading ? "Saving…" : initial ? "Save Changes" : "Add Part"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function PartsManagement() {
  const [parts, setParts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tab, setTab] = useState("all"); // "all" | "lowstock"

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const [partsData, vendorData] = await Promise.all([
        partsApi("/part"),
        partsApi("/vendor"),
      ]);
      setParts(partsData);
      setVendors(vendorData);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  const filtered = parts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchTab = tab === "all" || (tab === "lowstock" && p.isLowStock);
    return matchSearch && matchCategory && matchTab;
  });

  const lowStockCount = parts.filter((p) => p.isLowStock).length;

  const handleCreate = async (form) => {
    setFormLoading(true); setFormError("");
    try { await partsApi("/part", { method: "POST", body: JSON.stringify(form) }); setModal(null); fetchParts(); }
    catch (e) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (form) => {
    setFormLoading(true); setFormError("");
    try { await partsApi(`/part/${modal.id}`, { method: "PUT", body: JSON.stringify(form) }); setModal(null); fetchParts(); }
    catch (e) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await partsApi(`/part/${id}`, { method: "DELETE" }); setDeleteConfirm(null); fetchParts(); }
    catch { /* silent */ }
  };

  return (
    <>
      <PageHeader
        title="Parts Inventory"
        subtitle="Manage vehicle parts stock, pricing, and categories"
        action={
          <Button onClick={() => { setFormError(""); setModal("create"); }}>
            <Plus size={14} strokeWidth={2.4} />
            Add Part
          </Button>
        }
      />

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 16px", borderRadius: "9px", marginBottom: "16px",
          background: "#fffbeb", border: "1px solid #fde68a",
          fontSize: "13px", color: "#92400e",
        }}>
          <span>⚠</span>
          <span><strong>{lowStockCount} part{lowStockCount > 1 ? "s" : ""}</strong> are running low on stock.</span>
          <button onClick={() => setTab("lowstock")} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#92400e", fontWeight: "600", cursor: "pointer", fontSize: "12.5px",
            textDecoration: "underline", fontFamily: "inherit",
          }}>View</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {["all", "lowstock"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 14px", borderRadius: "7px", border: "none",
            fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit",
            background: tab === t ? "var(--purple-600)" : "white",
            color: tab === t ? "white" : "#6d5d8a",
            boxShadow: tab === t ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            {t === "all" ? `All Parts (${parts.length})` : `Low Stock (${lowStockCount})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <input
          type="text" placeholder="Search by name or part number…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, padding: "8px 12px", border: "1px solid var(--border)",
            borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit", outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple-400)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <select
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "8px 12px", border: "1px solid var(--border)",
            borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit",
            outline: "none", background: "white", color: "#1a1523", cursor: "pointer",
          }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <Card>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="🔧"
            title={search || categoryFilter !== "All" ? "No parts match" : "No parts yet"}
            description={search ? "Try a different search." : "Add your first part to inventory."}
            action={!search && <Button onClick={() => setModal("create")}>Add Part</Button>}
          />
        ) : (
          <Table headers={["Part", "Vendor", "Category", "Stock", "Purchase Price", "Selling Price", "Status", ""]}>
            {filtered.map((p) => (
              <TR key={p.id}>
                <TD>
                  <p style={{ fontWeight: "500", margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: "11.5px", color: "#9d8db8", margin: 0, fontFamily: "'DM Mono', monospace" }}>{p.partNumber}</p>
                </TD>
                <TD>{p.vendorName || "—"}</TD>
                <TD><Badge color="gray">{p.category}</Badge></TD>
                <TD>
                  <span style={{ fontWeight: "600", color: p.isLowStock ? "#d97706" : "#1a1523" }}>
                    {p.stockQuantity}
                  </span>
                  {p.isLowStock && <span style={{ fontSize: "11px", color: "#d97706", marginLeft: "6px" }}>⚠ Low</span>}
                </TD>
                <TD muted>Rs. {p.purchasePrice.toLocaleString()}</TD>
                <TD style={{ fontWeight: "500", color: "var(--purple-700)" }}>Rs. {p.sellingPrice.toLocaleString()}</TD>
                <TD><Badge color={p.isActive ? "green" : "red"}>{p.isActive ? "Active" : "Inactive"}</Badge></TD>
                <TD>
                  <div style={{ display: "flex", gap: "2px", justifyContent: "flex-end" }}>
                    <ActionButton onClick={() => { setFormError(""); setModal(p); }}>Edit</ActionButton>
                    <ActionButton variant="delete" onClick={() => setDeleteConfirm(p)}>Delete</ActionButton>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {parts.length > 0 && (
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#9d8db8", textAlign: "right" }}>
          {filtered.length} of {parts.length} parts
        </p>
      )}

      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Add Part">
        <PartForm vendors={vendors} onSubmit={handleCreate} onCancel={() => setModal(null)} loading={formLoading} error={formError} />
      </Modal>

      <Modal open={modal && modal !== "create"} onClose={() => setModal(null)} title="Edit Part">
        {modal && modal !== "create" && (
          <PartForm vendors={vendors} initial={modal} onSubmit={handleUpdate} onCancel={() => setModal(null)} loading={formLoading} error={formError} />
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Part">
        <p style={{ fontSize: "13.5px", color: "#6d5d8a", marginBottom: "20px", lineHeight: 1.6 }}>
          Remove <strong style={{ color: "#1a1523" }}>{deleteConfirm?.name}</strong> from inventory? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1 }}>Delete</Button>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}
