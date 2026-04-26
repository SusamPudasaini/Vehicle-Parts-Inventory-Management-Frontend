import { useState, useEffect, useCallback } from "react";
import { staffApi } from "../../services/api";
import {
  PageHeader, Button, Badge, Card, Input, Select,
  Modal, EmptyState, Spinner, Alert, Table, TR, TD, ActionButton
} from "../../components/ui";

function StaffForm({ initial, onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState(
    initial || { fullName: "", email: "", password: "", role: "Staff", phoneNumber: "", isActive: true }
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setCheck = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <Alert message={error} />
      <Input label="Full Name" placeholder="John Doe" value={form.fullName} onChange={set("fullName")} required />
      <Input label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={set("email")} required />
      {!initial && (
        <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} required />
      )}
      <Input label="Phone Number" placeholder="+977 98XXXXXXXX" value={form.phoneNumber} onChange={set("phoneNumber")} />
      <Select label="Role" value={form.role} onChange={set("role")}>
        <option value="Staff">Staff</option>
        <option value="Admin">Admin</option>
      </Select>
      {initial && (
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "#4c3d6b", cursor: "pointer" }}>
          <input type="checkbox" checked={form.isActive} onChange={setCheck("isActive")} />
          Active
        </label>
      )}
      <div style={{ display: "flex", gap: "10px", paddingTop: "6px" }}>
        <Button type="button" onClick={() => onSubmit(form)} disabled={loading} style={{ flex: 1 }}>
          {loading ? "Saving…" : initial ? "Save Changes" : "Add Staff"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAll();
      setStaff(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleCreate = async (form) => {
    setFormLoading(true); setFormError("");
    try { await staffApi.create(form); setModal(null); fetchStaff(); }
    catch (e) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (form) => {
    setFormLoading(true); setFormError("");
    try { await staffApi.update(modal.id, form); setModal(null); fetchStaff(); }
    catch (e) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    try { await staffApi.delete(id); setDeleteConfirm(null); fetchStaff(); }
    catch { /* silent */ }
  };

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Manage staff accounts and system roles"
        action={
          <Button onClick={() => { setFormError(""); setModal("create"); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Staff
          </Button>
        }
      />

      <Card>
        {loading ? <Spinner /> : staff.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No staff members yet"
            description="Add your first staff member to get started."
            action={<Button onClick={() => setModal("create")}>Add Staff</Button>}
          />
        ) : (
          <Table headers={["Name", "Email", "Phone", "Role", "Status", "Joined", ""]}>
            {staff.map((s) => (
              <TR key={s.id}>
                <TD style={{ fontWeight: "500" }}>{s.fullName}</TD>
                <TD muted>{s.email}</TD>
                <TD muted>{s.phoneNumber || "—"}</TD>
                <TD>
                  <Badge color={s.role === "Admin" ? "purple" : "gray"}>{s.role}</Badge>
                </TD>
                <TD>
                  <Badge color={s.isActive ? "green" : "red"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                </TD>
                <TD muted>{new Date(s.createdAt).toLocaleDateString()}</TD>
                <TD>
                  <div style={{ display: "flex", gap: "2px", justifyContent: "flex-end" }}>
                    <ActionButton onClick={() => { setFormError(""); setModal(s); }}>Edit</ActionButton>
                    <ActionButton variant="delete" onClick={() => setDeleteConfirm(s)}>Delete</ActionButton>
                  </div>
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Add Staff Member">
        <StaffForm onSubmit={handleCreate} onCancel={() => setModal(null)} loading={formLoading} error={formError} />
      </Modal>

      <Modal open={modal && modal !== "create"} onClose={() => setModal(null)} title="Edit Staff Member">
        {modal && modal !== "create" && (
          <StaffForm initial={modal} onSubmit={handleUpdate} onCancel={() => setModal(null)} loading={formLoading} error={formError} />
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Staff Member">
        <p style={{ fontSize: "13.5px", color: "#6d5d8a", marginBottom: "20px", lineHeight: 1.6 }}>
          Remove <strong style={{ color: "#1a1523" }}>{deleteConfirm?.fullName}</strong> from the system? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm.id)} style={{ flex: 1 }}>Delete</Button>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}
