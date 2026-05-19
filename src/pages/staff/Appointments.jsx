import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { appointmentApi, customerInvoiceApi } from "../../services/api";
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Spinner, Table, TD, TR } from "../../components/ui";

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

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: 0, label: "Pending" },
  { value: 1, label: "Confirmed" },
  { value: 2, label: "Completed" },
  { value: 3, label: "Cancelled" },
];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointmentId: null });
  const [completeModal, setCompleteModal] = useState({ open: false, appointment: null });
  const [completeForm, setCompleteForm] = useState({ amount: "", staffNotes: "" });
  const [rescheduleForm, setRescheduleForm] = useState({ date: "", time: "" });
  const [saving, setSaving] = useState(false);

  const minDate = new Date().toISOString().slice(0, 10);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentApi.getAll();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return appointments;
    return appointments.filter((appt) => appt.status === Number(filter));
  }, [appointments, filter]);

  const handleStatus = async (appointmentId, status) => {
    if (status === 2) {
      const appt = appointments.find((a) => a.appointmentId === appointmentId);
      setCompleteForm({ amount: "", staffNotes: "" });
      setCompleteModal({ open: true, appointment: appt });
      return;
    }

    setSaving(true);
    try {
      await appointmentApi.updateStatus(appointmentId, status);
      toast.success("Appointment updated.");
      await loadAppointments();
    } catch (e) {
      toast.error(e.message || "Failed to update appointment.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteWithInvoice = async () => {
    const amount = Number(completeForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid service amount.");
      return;
    }

    setSaving(true);
    try {
      await customerInvoiceApi.completeService(completeModal.appointment.appointmentId, {
        amount,
        staffNotes: completeForm.staffNotes.trim() || null,
      });
      toast.success("Service completed and invoice emailed.");
      setCompleteModal({ open: false, appointment: null });
      await loadAppointments();
    } catch (e) {
      toast.error(e.message || "Failed to complete service.");
    } finally {
      setSaving(false);
    }
  };

  const openReschedule = (appointment) => {
    const when = appointment.appointmentDateTime ? new Date(appointment.appointmentDateTime) : null;
    setRescheduleForm({
      date: when ? when.toISOString().slice(0, 10) : "",
      time: when ? when.toISOString().slice(11, 16) : "",
    });
    setRescheduleModal({ open: true, appointmentId: appointment.appointmentId });
  };

  const handleReschedule = async () => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast.error("Please select a date and time.");
      return;
    }

    const selected = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`);
    if (Number.isNaN(selected.getTime())) {
      toast.error("Please enter a valid date and time.");
      return;
    }
    if (selected < new Date()) {
      toast.error("Appointment date/time cannot be in the past.");
      return;
    }

    setSaving(true);
    try {
      await appointmentApi.reschedule(rescheduleModal.appointmentId, selected.toISOString());
      toast.success("Appointment rescheduled.");
      setRescheduleModal({ open: false, appointmentId: null });
      await loadAppointments();
    } catch (e) {
      toast.error(e.message || "Failed to reschedule.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader
        title="Appointments"
        subtitle="View bookings, approve/disapprove requests, and manage schedules"
        action={
          <Button variant="secondary" onClick={loadAppointments}>
            Refresh
          </Button>
        }
      />

      <Card style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CalendarClock size={16} strokeWidth={2.2} />
          <span style={{ fontSize: "13px", color: "#6d5d8a" }}>Filter status</span>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Badge color="purple">{filtered.length}</Badge>
      </Card>

      <Card>
        <Table headers={["Customer", "Service", "Schedule", "Vehicle", "Status", "Actions"]}>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9d8db8" }}>
                No appointments to show.
              </td>
            </tr>
          ) : (
            filtered.map((appt) => (
              <TR key={appt.appointmentId}>
                <TD>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: 600 }}>{appt.customerName || `Customer #${appt.customerId}`}</span>
                    <span style={{ fontSize: "12px", color: "#9d8db8" }}>{appt.customerEmail}</span>
                  </div>
                </TD>
                <TD>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: 600 }}>{appt.serviceType}</span>
                    {appt.notes && <span style={{ fontSize: "12px", color: "#9d8db8" }}>{appt.notes}</span>}
                  </div>
                </TD>
                <TD>
                  {appt.appointmentDateTime
                    ? new Date(appt.appointmentDateTime).toLocaleString()
                    : "-"}
                </TD>
                <TD>
                  {appt.vehicleNumber
                    ? `${appt.vehicleNumber} � ${appt.vehicleMake || ""} ${appt.vehicleModel || ""}`.trim()
                    : "Not selected"}
                </TD>
                <TD>
                  <Badge color={STATUS_COLORS[appt.status] || "gray"}>
                    {STATUS_LABELS[appt.status] || "Unknown"}
                  </Badge>
                </TD>
                <TD>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {appt.status === 0 && (
                      <>
                        <Button onClick={() => handleStatus(appt.appointmentId, 1)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                          <CheckCircle2 size={14} strokeWidth={2.2} />
                          Approve
                        </Button>
                        <Button variant="secondary" onClick={() => handleStatus(appt.appointmentId, 3)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                          <XCircle size={14} strokeWidth={2.2} />
                          Disapprove
                        </Button>
                      </>
                    )}
                    {appt.status === 1 && (
                      <>
                        <Button onClick={() => handleStatus(appt.appointmentId, 2)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                          Mark complete
                        </Button>
                        <Button variant="secondary" onClick={() => openReschedule(appt)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                          Reschedule
                        </Button>
                        <Button variant="secondary" onClick={() => handleStatus(appt.appointmentId, 3)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {appt.status === 2 && (
                      <Button variant="secondary" onClick={() => handleStatus(appt.appointmentId, 3)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                        Cancel
                      </Button>
                    )}
                    {appt.status === 3 && (
                      <Button variant="secondary" onClick={() => handleStatus(appt.appointmentId, 1)} disabled={saving} style={{ padding: "5px 10px", fontSize: "12px" }}>
                        Reopen
                      </Button>
                    )}
                  </div>
                </TD>
              </TR>
            ))
          )}
        </Table>
      </Card>

      <Modal
        open={completeModal.open}
        onClose={() => setCompleteModal({ open: false, appointment: null })}
        title="Complete service & send invoice"
      >
        {completeModal.appointment && (
          <div style={{ display: "grid", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#6d5d8a" }}>
              {completeModal.appointment.serviceType} for {completeModal.appointment.customerName}
            </p>
            <Input
              label="Service charge (Rs.)"
              type="number"
              min="0"
              step="0.01"
              value={completeForm.amount}
              onChange={(e) => setCompleteForm((s) => ({ ...s, amount: e.target.value }))}
            />
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: 500, color: "#4c3d6b", display: "block", marginBottom: "6px" }}>
                Notes (optional)
              </label>
              <textarea
                value={completeForm.staffNotes}
                onChange={(e) => setCompleteForm((s) => ({ ...s, staffNotes: e.target.value }))}
                style={{ width: "100%", minHeight: "72px", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontFamily: "inherit" }}
              />
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <Button variant="secondary" onClick={() => setCompleteModal({ open: false, appointment: null })}>
            Cancel
          </Button>
          <Button onClick={handleCompleteWithInvoice} disabled={saving}>
            {saving ? "Sending…" : "Complete & email invoice"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, appointmentId: null })}
        title="Reschedule appointment"
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <Input label="Date" type="date" min={minDate} value={rescheduleForm.date} onChange={(e) => setRescheduleForm((s) => ({ ...s, date: e.target.value }))} />
          <Input label="Time" type="time" value={rescheduleForm.time} onChange={(e) => setRescheduleForm((s) => ({ ...s, time: e.target.value }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
          <Button variant="secondary" onClick={() => setRescheduleModal({ open: false, appointmentId: null })}>
            Cancel
          </Button>
          <Button onClick={handleReschedule} disabled={saving}>
            {saving ? "Saving..." : "Save schedule"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
