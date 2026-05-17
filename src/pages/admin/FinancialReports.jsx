import { useState } from "react";
import { PageHeader, Card, Spinner, Alert } from "../../components/ui";

const BASE_URL = "https://localhost:7041/api";

async function api(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { "Content-Type": "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "var(--purple-50)", borderRadius: "10px",
      border: "1px solid var(--purple-100)", padding: "16px 20px",
    }}>
      <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: "700", color: "var(--purple-700)", margin: "0 0 2px" }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: "#9d8db8", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function ReportResults({ report }) {
  if (!report) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#1a1523", margin: 0 }}>{report.period}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <StatCard label="Total Purchases" value={`Rs. ${report.totalPurchases.toLocaleString()}`} />
        <StatCard label="Invoices" value={report.totalInvoices} sub="purchase orders" />
        <StatCard label="Items Bought" value={report.totalItemsBought} sub="units restocked" />
      </div>

      {report.invoices.length === 0 ? (
        <Card style={{ padding: "32px", textAlign: "center" }}>
          <p style={{ color: "#9d8db8", fontSize: "13.5px", margin: 0 }}>No invoices found for this period.</p>
        </Card>
      ) : (
        <Card>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#9d8db8", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Invoices in this period
            </p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Invoice #", "Vendor", "Date", "Items", "Total"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", color: "#9d8db8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--purple-50)" }}>
                  <td style={{ padding: "11px 16px", fontFamily: "'DM Mono', monospace", fontSize: "12.5px", color: "#4c3d6b" }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: "11px 16px", fontWeight: "500" }}>{inv.vendorName}</td>
                  <td style={{ padding: "11px 16px", color: "#9d8db8" }}>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td style={{ padding: "11px 16px", color: "#9d8db8" }}>{inv.items.length}</td>
                  <td style={{ padding: "11px 16px", fontWeight: "600", color: "var(--purple-700)" }}>Rs. {inv.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

export default function FinancialReports() {
  const [reportType, setReportType] = useState("monthly");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true); setError(""); setReport(null);
    try {
      let url = "";
      if (reportType === "daily") url = `/purchaseinvoice/report/daily?date=${date}`;
      else if (reportType === "monthly") url = `/purchaseinvoice/report/monthly?year=${year}&month=${month}`;
      else url = `/purchaseinvoice/report/yearly?year=${year}`;
      const data = await api(url);
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <PageHeader title="Financial Reports" subtitle="View daily, monthly, and yearly purchase summaries" />

      <Card style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          {/* Report type tabs */}
          <div>
            <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Report Type</label>
            <div style={{ display: "flex", gap: "4px" }}>
              {["daily", "monthly", "yearly"].map((t) => (
                <button key={t} onClick={() => setReportType(t)} style={{
                  padding: "7px 14px", borderRadius: "7px", border: "none",
                  fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "inherit",
                  background: reportType === t ? "var(--purple-600)" : "var(--purple-50)",
                  color: reportType === t ? "white" : "#6d5d8a",
                  textTransform: "capitalize",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date pickers */}
          {reportType === "daily" && (
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit", outline: "none" }} />
            </div>
          )}

          {reportType === "monthly" && (
            <>
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Month</label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit", outline: "none", background: "white" }}>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Year</label>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit", outline: "none", background: "white" }}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {reportType === "yearly" && (
            <div>
              <label style={{ fontSize: "12.5px", fontWeight: "500", color: "#4c3d6b", display: "block", marginBottom: "6px" }}>Year</label>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13.5px", fontFamily: "inherit", outline: "none", background: "white" }}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} style={{
            padding: "9px 20px", background: "var(--purple-600)", color: "white",
            border: "none", borderRadius: "8px", fontSize: "13.5px", fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </Card>

      {error && <Alert message={error} />}
      {loading && <Spinner />}
      {report && <ReportResults report={report} />}
    </>
  );
}
