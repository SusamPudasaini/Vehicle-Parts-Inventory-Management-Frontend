import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { customerApi } from "../../services/api";
import { PageHeader, Button, Badge, Card, Spinner, EmptyState, Table, TR, TD, Modal, Input } from "../../components/ui";

function Avatar({ name }) {
  return (
    <div style={{
      width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, var(--purple-500), var(--accent))",
      color: "white", fontSize: "12px", fontWeight: "600",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

function CustomerRow({ customer, onEdit, onDelete }) {
  return (
    <TR>
      <TD>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar name={customer.fullName} />
          <div>
            <p style={{ fontWeight: "500", margin: 0, fontSize: "13.5px" }}>{customer.fullName}</p>
            <p style={{ fontSize: "12px", color: "#9d8db8", margin: 0 }}>{customer.email}</p>
          </div>
        </div>
      </TD>
      <TD muted>{customer.phone || "—"}</TD>
      <TD>
        {customer.vehicles?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {customer.vehicles.slice(0, 2).map((v) => (
              <Badge key={v.id} color="purple">{v.vehicleNumber}</Badge>
            ))}
            {customer.vehicles.length > 2 && (
              <Badge color="gray">+{customer.vehicles.length - 2}</Badge>
            )}
          </div>
        ) : (
          <span style={{ fontSize: "12px", color: "#9d8db8" }}>No vehicles</span>
        )}
      </TD>
      <TD muted>{new Date(customer.registeredAt).toLocaleDateString()}</TD>
      <TD>
        <div style={{ display: "flex", gap: "6px" }}>
          <Button variant="secondary" onClick={() => onEdit(customer)} style={{ padding: "5px 10px", fontSize: "12px" }}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => onDelete(customer)} style={{ padding: "5px 10px", fontSize: "12px" }}>
            Delete
          </Button>
        </div>
      </TD>
    </TR>
  );
}

export function SearchCustomers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const [editModal, setEditModal] = useState({ open: false, customer: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, customer: null });
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = useCallback(async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try { const data = await customerApi.search(q.trim()); setResults(data); }
    catch { setResults([]); }
    finally { setLoading(false); }
  }, [query]);

  const openEdit = (customer) => {
    setEditForm({
      fullName: customer.fullName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setEditModal({ open: true, customer });
  };

  const openDelete = (customer) => {
    setDeleteModal({ open: true, customer });
  };

  const handleUpdate = async () => {
    if (!editModal.customer) return;
    if (!editForm.fullName.trim()) return toast.error("Full name is required.");
    if (!editForm.email.trim()) return toast.error("Email is required.");
    if (!editForm.phone.trim()) return toast.error("Phone is required.");

    setSaving(true);
    try {
      const updated = await customerApi.update(editModal.customer.id, editForm);
      setResults((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Customer updated.");
      setEditModal({ open: false, customer: null });
    } catch (e) {
      toast.error(e.message || "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.customer) return;
    setSaving(true);
    try {
      await customerApi.delete(deleteModal.customer.id);
      setResults((prev) => prev.filter((c) => c.id !== deleteModal.customer.id));
      toast.success("Customer deleted.");
      setDeleteModal({ open: false, customer: null });
    } catch (e) {
      toast.error(e.message || "Failed to delete customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Search" subtitle="Find customers by name, phone, ID, or vehicle plate" />

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} strokeWidth={2.2} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9d8db8" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Name, phone, ID, or vehicle number…"
            style={{
              width: "100%", padding: "9px 12px 9px 36px",
              border: "1px solid var(--border)", borderRadius: "8px",
              fontSize: "13.5px", background: "white", color: "#1a1523",
              outline: "none", fontFamily: "inherit",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple-400)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        <Button onClick={() => handleSearch()} disabled={!query.trim() || loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {!searched && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
          {["Name", "Phone number", "Vehicle plate", "Customer ID"].map((hint) => (
            <span key={hint} style={{
              padding: "4px 12px", background: "var(--purple-50)",
              borderRadius: "99px", fontSize: "12px", color: "var(--purple-700)",
              border: "1px solid var(--purple-100)",
            }}>
              {hint}
            </span>
          ))}
        </div>
      )}

      {loading ? <Spinner /> : searched && (
        <Card>
          {results.length === 0 ? (
            <EmptyState icon="🔍" title="No results" description={`Nothing found for "${query}". Try a different term.`} />
          ) : (
            <>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: "12px", color: "#9d8db8", margin: 0 }}>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Table headers={["Customer", "Phone", "Vehicles", "Registered", "Actions"]}>
                {results.map((c) => (
                  <CustomerRow key={c.id} customer={c} onEdit={openEdit} onDelete={openDelete} />
                ))}
              </Table>
            </>
          )}
        </Card>
      )}

      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, customer: null })}
        title="Edit customer"
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <Input label="Full name" value={editForm.fullName} onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <Button variant="secondary" onClick={() => setEditModal({ open: false, customer: null })}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, customer: null })}
        title="Delete customer"
      >
        <p style={{ fontSize: "13px", color: "#6d5d8a", margin: "0 0 16px" }}>
          Are you sure you want to delete {deleteModal.customer?.fullName}? This will remove their vehicles and history.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, customer: null })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editModal, setEditModal] = useState({ open: false, customer: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, customer: null });
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.getAll().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.vehicles?.some((v) => v.vehicleNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const openEdit = (customer) => {
    setEditForm({
      fullName: customer.fullName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setEditModal({ open: true, customer });
  };

  const openDelete = (customer) => {
    setDeleteModal({ open: true, customer });
  };

  const handleUpdate = async () => {
    if (!editModal.customer) return;
    if (!editForm.fullName.trim()) return toast.error("Full name is required.");
    if (!editForm.email.trim()) return toast.error("Email is required.");
    if (!editForm.phone.trim()) return toast.error("Phone is required.");

    setSaving(true);
    try {
      const updated = await customerApi.update(editModal.customer.id, editForm);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Customer updated.");
      setEditModal({ open: false, customer: null });
    } catch (e) {
      toast.error(e.message || "Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.customer) return;
    setSaving(true);
    try {
      await customerApi.delete(deleteModal.customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteModal.customer.id));
      toast.success("Customer deleted.");
      setDeleteModal({ open: false, customer: null });
    } catch (e) {
      toast.error(e.message || "Failed to delete customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="All registered customers and their vehicles"
        action={
          <Button onClick={() => navigate("/staff/register-customer")}>
            <Plus size={14} strokeWidth={2.4} />
            Register Customer
          </Button>
        }
      />

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, phone, or vehicle…"
          style={{
            width: "100%", padding: "9px 12px",
            border: "1px solid var(--border)", borderRadius: "8px",
            fontSize: "13.5px", background: "white", color: "#1a1523",
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--purple-400)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
        />
      </div>

      <Card>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="👤"
            title={search ? "No matches" : "No customers yet"}
            description={search ? "Try a different filter." : "Register your first customer."}
            action={!search && <Button onClick={() => navigate("/staff/register-customer")}>Register Customer</Button>}
          />
        ) : (
          <Table headers={["Customer", "Phone", "Vehicles", "Registered", "Actions"]}>
            {filtered.map((c) => (
              <CustomerRow key={c.id} customer={c} onEdit={openEdit} onDelete={openDelete} />
            ))}
          </Table>
        )}
      </Card>

      {customers.length > 0 && (
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#9d8db8", textAlign: "right" }}>
          {filtered.length} of {customers.length} customers
        </p>
      )}

      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, customer: null })}
        title="Edit customer"
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <Input label="Full name" value={editForm.fullName} onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))} />
          <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <Button variant="secondary" onClick={() => setEditModal({ open: false, customer: null })}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, customer: null })}
        title="Delete customer"
      >
        <p style={{ fontSize: "13px", color: "#6d5d8a", margin: "0 0 16px" }}>
          Are you sure you want to delete {deleteModal.customer?.fullName}? This will remove their vehicles and history.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button variant="secondary" onClick={() => setDeleteModal({ open: false, customer: null })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
