import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { partRequestApi } from "../../services/api";
import { Badge, Button, Card, EmptyState, PageHeader, Select, Spinner, Table, TD, TR } from "../../components/ui";

const STATUS_OPTIONS = [
  { value: 0, label: "Pending", color: "yellow" },
  { value: 1, label: "Ordered", color: "blue" },
  { value: 2, label: "Available", color: "green" },
  { value: 3, label: "Cancelled", color: "red" },
];

const statusLabel = (status) => STATUS_OPTIONS.find((s) => s.value === status)?.label || "Unknown";
const statusColor = (status) => STATUS_OPTIONS.find((s) => s.value === status)?.color || "gray";

export default function PartRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await partRequestApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      const nextDrafts = {};
      list.forEach((req) => {
        nextDrafts[req.partRequestId] = req.status;
      });
      setStatusDrafts(nextDrafts);
    } catch (e) {
      toast.error(e.message || "Failed to load part requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdate = async (requestId) => {
    const request = requests.find((r) => r.partRequestId === requestId);
    if (!request) return;

    const nextStatus = Number(statusDrafts[requestId]);
    if (Number.isNaN(nextStatus) || nextStatus === request.status) return;

    setSavingId(requestId);
    try {
      await partRequestApi.updateStatus(requestId, nextStatus);
      setRequests((prev) => prev.map((r) => (
        r.partRequestId === requestId ? { ...r, status: nextStatus } : r
      )));
      toast.success("Status updated.");
    } catch (e) {
      toast.error(e.message || "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Part Requests"
        subtitle="Review unavailable part requests and update statuses for customers."
        action={
          <Button variant="secondary" onClick={loadRequests}>
            Refresh
          </Button>
        }
      />

      <Card>
        {requests.length === 0 ? (
          <EmptyState
            icon="\ud83d\udce6"
            title="No part requests"
            description="New customer requests will appear here."
          />
        ) : (
          <Table headers={["Customer", "Part", "Qty / Vehicle", "Status", "Requested", "Actions"]}>
            {requests.map((req) => {
              const selectedStatus = statusDrafts[req.partRequestId] ?? req.status;
              const isSaving = savingId === req.partRequestId;
              const hasChanges = Number(selectedStatus) !== req.status;

              return (
                <TR key={req.partRequestId}>
                  <TD>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{req.customerName}</span>
                      <span style={{ fontSize: "12px", color: "#9d8db8" }}>#{req.customerId}</span>
                    </div>
                  </TD>
                  <TD>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{req.partName}</span>
                      {req.description && (
                        <span style={{ fontSize: "12px", color: "#9d8db8" }}>{req.description}</span>
                      )}
                    </div>
                  </TD>
                  <TD muted>
                    {req.quantity}{req.vehicleNumber ? ` / ${req.vehicleNumber}` : ""}
                  </TD>
                  <TD>
                    <Badge color={statusColor(req.status)}>{statusLabel(req.status)}</Badge>
                  </TD>
                  <TD muted>{new Date(req.createdAtUtc).toLocaleDateString()}</TD>
                  <TD>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ minWidth: "140px" }}>
                        <Select
                          value={selectedStatus}
                          onChange={(e) => setStatusDrafts((prev) => ({
                            ...prev,
                            [req.partRequestId]: Number(e.target.value),
                          }))}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <Button
                        onClick={() => handleUpdate(req.partRequestId)}
                        disabled={!hasChanges || isSaving}
                      >
                        {isSaving ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
