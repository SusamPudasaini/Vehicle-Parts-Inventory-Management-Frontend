import { useState, useEffect, useCallback } from "react";
import { vendorApi } from "../../services/api";
import {
  PageHeader, Button, Card, Input,
  Modal, EmptyState, Spinner, Alert, Table, TR, TD, ActionButton
} from "../../components/ui";

function VendorForm({ initial, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(
    initial || { name: "", contactPerson: "", email: "", phone: "", address: "" }
  );
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Alert message={error} />
      <Input label="Vendor Name" placeholder="e.g. Toyota Parts Ltd." value={form.name} onChange={set("name")} required />
      <Input label="Contact Person" placeholder="Full name" value={form.contactPerson} onChange={set("contactPerson")} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Input label="Email" type="email" placeholder="vendor@example.com" value={form.email} onChange={set("email")} />
        <Input label="Phone" placeholder="+977 98XXXXXXXX" value={form.phone} onChange={set("phone")} />
      </div>
      <Input label="Address" placeholder="Street, City, Country" value={form.address} onChange={set("address")} />
      <div style={{ display: "flex", gap: "10px", paddingTop: "6px" }}>
        <Button type="button" onClick={() => onSubmit(form)} disabled={loading} style={{ flex: 1 }}>
          {loading ? "Saving…" : initial ? "Save Changes" : "Add Vendor"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState("");

  const fetchVendors = useCallback(async () => {
    try { setLoading(true); const data = await vendorApi.getAll(); setVendors(data); }
    catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search)
  );

  const handleCreate = async (form) => {
    setFormLoading(true); setFormError("");
    try { await vendorApi.create(form); setModal(null); fetchVendors(); }
    catch (e) { setFormError(e.message); } finally { setFormLoading(false); }
  };

  const handleUpdate = async (form) => {
    setFormLoading(true); setFormError("");
    try { await vendorApi.update(modal.id, form); setModal(null); fetchVendors(); }
    catch (e) { setFormError(e.message); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await vendorApi.delete(id); setDeleteConfirm(null); fetchVendors(); }
    catch { /* silent */ }
  };

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="Manage parts suppliers and vendor contacts"
        action={
          <Button onClick={() => { setFormError(""); setModal("create"); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Vendor
          </Button>
        }
      />

      <div style={{ marginBottom: "16px" }}>
        <Input
          placeholder="Search vendors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="🏭"
            title={search ? "No vendors match" : "No vendors yet"}
            description={search ? "Try a different search term." : "Add your first vendor to get started."}
            action={!search && <Button onClick={() => setModal("create")}>Add Vendor</Button>}
          />
        ) : (
          <Table headers={["Vendor", "Contact", "Phone", "Address", ""]}>
            {filtered.map((v) => (
              <TR key={v.id}>
                <TD>
                  <p style={{ fontWeight: "500", margin: 0 }}>{v.name}</p>
                  <p style={{ fontSize: "12px", color: "#9d8db8", margin: 0 }}>{v.email || "No email"}</p>
                </TD>
                <TD muted>{v.contactPerson || "—"}</TD>
                <TD muted>{v.phone || "—"}</TD>
                <TD muted style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.address || "—"}
                </TD>
                <TD>
                  <div style={{ display: "flex", gap: "2px", justifyContent: "flex-end" }}>
                    <ActionButton onClick={() => { setFormError(""); setModal(v); }}>Edit</ActionButton>
                    <ActionButton variant="delete" onClick={() => setDeleteConfirm(v)}>Delete</ActionButton>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {vendors.length > 0 && (
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#9d8db8", textAlign: "right" }}>
          {filtered.length} of {vendors.length} vendors
        </p>
      )}

      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Add Vendor">
        <VendorForm onSubmit={handleCreate} onCancel={() => setModal(null)} loading={formLoading} error={formError} />
      </Modal>

      <Modal open={modal && modal !== "create"} onClose={() => setModal(null)} title="Edit Vendor">
        {modal && modal !== "create" && (
          <VendorForm initial={modal} onSubmit={handleUpdate} onCancel={() => setModal(null)} loading={formLoading} error={formError} />
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Vendor">
        <p style={{ fontSize: "13.5px", color: "#6d5d8a", marginBottom: "20px", lineHeight: 1.6 }}>
          Remove <strong style={{ color: "#1a1523" }}>{deleteConfirm?.name}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1 }}>Delete</Button>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}
