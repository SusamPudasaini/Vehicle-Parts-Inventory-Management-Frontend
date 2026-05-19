import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { appointmentApi, customerProfileApi } from "../../services/api";
import { Badge, Button, Card, Input, PageHeader, Select, Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const SERVICE_OPTIONS = [
  "Oil Change",
  "Brake Service",
  "Engine Diagnostics",
  "Tire Rotation",
  "Battery Check",
  "General Inspection",
  "Other",
];

const STATUS_LABELS = {
  0: "Pending",
  1: "Confirmed",
  2: "Completed",
  3: "Cancelled",
};

const STATUS_COLORS = {
  0: "yellow",
  1: "green",
  2: "blue",
  3: "red",
};

export default function CustomerAppointments() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    serviceType: "",
    customServiceType: "",
    date: "",
    time: "",
    vehicleId: "",
    notes: "",
  });

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const today = new Date();
  const minDate = today.toISOString().slice(0, 10);

  const isLoginError = (error) => /log\s?in|logged\s?in/i.test(error?.message || "");

  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const profileData = await customerProfileApi.getProfile();
        if (!alive) return;
        setProfile(profileData);
        setVehicles(profileData?.vehicles || []);

        if (profileData?.id) {
          const list = await appointmentApi.getByCustomer(profileData.id);
          setAppointments(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!alive) return;
        if (user?.role === "Customer" && isLoginError(e)) {
          setProfile((prev) => prev || user);
          setVehicles([]);
          return;
        }
        toast.error(e.message || "Failed to load appointments.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, []);

  const serviceTypeValue = useMemo(() => {
    if (form.serviceType === "Other") {
      return form.customServiceType.trim();
    }
    return form.serviceType.trim();
  }, [form.serviceType, form.customServiceType]);

  const validate = () => {
    if (!serviceTypeValue) return "Please select a service type.";
    if (!form.date) return "Please select a date.";
    if (!form.time) return "Please select a time.";
    const selected = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(selected.getTime())) return "Please enter a valid date and time.";
    if (selected < new Date()) return "Appointment date/time cannot be in the past.";
    return null;
  };

  const handleContinue = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    const customerId = profile?.id || user?.id;
    if (!customerId) {
      toast.error("Please log in to book an appointment.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        appointmentDateTime: `${form.date}T${form.time}`,
        serviceType: serviceTypeValue,
        notes: form.notes.trim() || null,
      };

      await appointmentApi.create(payload);
      toast.success("Appointment booked successfully.");
      setStep("success");
      setForm({ serviceType: "", customServiceType: "", date: "", time: "", vehicleId: "", notes: "" });

      const list = await appointmentApi.getByCustomer(customerId);
      setAppointments(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e.message || "Failed to book appointment.");
    } finally {
      setSaving(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(form.vehicleId));

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Book Appointment"
        subtitle="Choose a service, date, and time. We will confirm your booking."
      />

      <Card style={{ padding: "22px", maxWidth: "720px" }}>
        {step === "form" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Select label="Service type" value={form.serviceType} onChange={setField("serviceType")}>
                <option value="">Select a service</option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
            </div>
            {form.serviceType === "Other" && (
              <div style={{ gridColumn: "1 / -1" }}>
                <Input
                  label="Describe the service"
                  placeholder="e.g. AC diagnosis"
                  value={form.customServiceType}
                  onChange={setField("customServiceType")}
                />
              </div>
            )}
            <Input label="Date" type="date" min={minDate} value={form.date} onChange={setField("date")} />
            <Input label="Time" type="time" value={form.time} onChange={setField("time")} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Select label="Vehicle (optional)" value={form.vehicleId} onChange={setField("vehicleId")}>
                <option value="">No vehicle selected</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNumber} · {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </Select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "13px", fontWeight: "500", color: "#4c3d6b" }}>
                Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Add any details for the service team"
                style={{
                  width: "100%",
                  minHeight: "96px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontFamily: "inherit",
                  marginTop: "6px",
                }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={handleContinue}>Continue</Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ fontSize: "13.5px", color: "#1a1523", margin: 0 }}>
              Please confirm your booking details.
            </p>
            <div style={{ display: "grid", gap: "8px" }}>
              <InfoRow label="Service" value={serviceTypeValue || "-"} />
              <InfoRow label="Date" value={form.date} />
              <InfoRow label="Time" value={form.time} />
              <InfoRow
                label="Vehicle"
                value={selectedVehicle
                  ? `${selectedVehicle.vehicleNumber} · ${selectedVehicle.make} ${selectedVehicle.model}`
                  : "Not selected"}
              />
              <InfoRow label="Notes" value={form.notes || "None"} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button variant="secondary" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={saving}>
                {saving ? "Booking..." : "Confirm booking"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1523", margin: 0 }}>
              Booking confirmed!
            </p>
            <p style={{ fontSize: "13px", color: "#7c6f96", margin: 0 }}>
              Your appointment request has been recorded. We will contact you if any changes are needed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setStep("form")}>Book another appointment</Button>
            </div>
          </div>
        )}
      </Card>

      <Card style={{ padding: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: 0 }}>
            Recent appointments
          </p>
          <Badge color="purple">{appointments.length}</Badge>
        </div>

        {appointments.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {appointments.slice(0, 6).map((appt) => (
              <div key={appt.appointmentId || appt.id} style={{
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "12px",
                display: "grid",
                gap: "6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1523", margin: 0 }}>
                    {appt.serviceType}
                  </p>
                  <Badge color={STATUS_COLORS[appt.status] || "gray"}>
                    {STATUS_LABELS[appt.status] || "Unknown"}
                  </Badge>
                </div>
                <p style={{ fontSize: "12.5px", color: "#7c6f96", margin: 0 }}>
                  {appt.appointmentDateTime
                    ? new Date(appt.appointmentDateTime).toLocaleString()
                    : "Date to be confirmed"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#9d8db8", margin: 0 }}>
            No appointments yet.
          </p>
        )}
      </Card>
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
