import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { customerProfileApi } from "../../services/api";
import { Badge, Button, Card, Input, Modal, PageHeader, Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const CURRENT_YEAR = new Date().getFullYear();

const emptyVehicle = {
  vehicleNumber: "",
  make: "",
  model: "",
  year: CURRENT_YEAR,
  color: "",
};

function VehicleCard({ vehicle, onEdit }) {
  return (
    <div style={{
      border: "1px solid var(--purple-100)",
      background: "var(--purple-50)",
      borderRadius: "12px",
      padding: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <div>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1523", margin: 0 }}>
            {vehicle.make} {vehicle.model}
          </p>
          <p style={{ fontSize: "12px", color: "#7c6f96", margin: "3px 0 0" }}>
            {vehicle.year || "Year not set"}{vehicle.color ? ` - ${vehicle.color}` : ""}
          </p>
        </div>
        <Badge color="purple">{vehicle.vehicleNumber || "No plate"}</Badge>
      </div>
      <Button variant="secondary" onClick={() => onEdit(vehicle)} style={{ alignSelf: "flex-start", padding: "6px 10px", fontSize: "12px" }}>
        Edit vehicle
      </Button>
    </div>
  );
}

export default function CustomerVehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyVehicle);
  const [editModal, setEditModal] = useState({ open: false, vehicleId: null });

  const isLoginError = (error) => /log\s?in|logged\s?in/i.test(error?.message || "");

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const loadVehicles = async () => {
    try {
      const data = await customerProfileApi.getVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      if (user?.role === "Customer" && isLoginError(e)) return;
      toast.error(e.message || "Could not load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const validate = (vehicle) => {
    if (!vehicle.vehicleNumber.trim()) return "Vehicle number is required.";
    if (!vehicle.make.trim()) return "Make is required.";
    if (!vehicle.model.trim()) return "Model is required.";
    const yearValue = Number(vehicle.year);
    if (!yearValue || yearValue < 1886 || yearValue > 2100) return "Enter a valid vehicle year.";
    return null;
  };

  const handleAdd = async () => {
    const err = validate(form);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const res = await customerProfileApi.addVehicle({
        vehicleNumber: form.vehicleNumber,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        color: form.color,
      });
      toast.success(res?.message || "Vehicle added successfully.");
      setForm({ ...emptyVehicle });
      await loadVehicles();
    } catch (e) {
      toast.error(e.message || "Failed to add vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (vehicle) => {
    setForm({
      vehicleNumber: vehicle.vehicleNumber || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || CURRENT_YEAR,
      color: vehicle.color || "",
    });
    setEditModal({ open: true, vehicleId: vehicle.id });
  };

  const handleUpdate = async () => {
    const err = validate(form);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const res = await customerProfileApi.updateVehicle(editModal.vehicleId, {
        vehicleNumber: form.vehicleNumber,
        make: form.make,
        model: form.model,
        year: Number(form.year),
        color: form.color,
      });
      toast.success(res?.message || "Vehicle updated successfully.");
      setEditModal({ open: false, vehicleId: null });
      setForm({ ...emptyVehicle });
      await loadVehicles();
    } catch (e) {
      toast.error(e.message || "Failed to update vehicle.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Manage Vehicles"
        subtitle="Add new vehicles and update existing vehicle information."
      />

      <Card style={{ padding: "22px", maxWidth: "680px" }}>
        <p style={{ fontSize: "13px", fontWeight: "600", color: "#1a1523", margin: "0 0 12px" }}>
          Add new vehicle
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="Vehicle / Plate number"
              placeholder="e.g. BA 1 CHA 1234"
              value={form.vehicleNumber}
              onChange={setField("vehicleNumber")}
            />
          </div>
          <Input label="Make" placeholder="e.g. Toyota" value={form.make} onChange={setField("make")} />
          <Input label="Model" placeholder="e.g. Corolla" value={form.model} onChange={setField("model")} />
          <Input label="Year" type="number" min="1886" max="2100" value={form.year} onChange={setField("year")} />
          <Input label="Color" placeholder="e.g. White" value={form.color} onChange={setField("color")} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? "Saving..." : "Add vehicle"}
          </Button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={openEdit} />
          ))
        ) : (
          <Card style={{ padding: "24px", textAlign: "center", color: "#9d8db8" }}>
            No vehicles added yet.
          </Card>
        )}
      </div>

      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, vehicleId: null })}
        title="Update vehicle"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Input
              label="Vehicle / Plate number"
              placeholder="e.g. BA 1 CHA 1234"
              value={form.vehicleNumber}
              onChange={setField("vehicleNumber")}
            />
          </div>
          <Input label="Make" placeholder="e.g. Toyota" value={form.make} onChange={setField("make")} />
          <Input label="Model" placeholder="e.g. Corolla" value={form.model} onChange={setField("model")} />
          <Input label="Year" type="number" min="1886" max="2100" value={form.year} onChange={setField("year")} />
          <Input label="Color" placeholder="e.g. White" value={form.color} onChange={setField("color")} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <Button variant="secondary" onClick={() => setEditModal({ open: false, vehicleId: null })}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? "Saving..." : "Update vehicle"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
