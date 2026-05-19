import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { customerReportsApi } from "../../services/api";
import { Badge, Card, PageHeader, Spinner, Table, TD, TR } from "../../components/ui";

function ReportTable({ title, subtitle, rows }) {
  return (
    <Card style={{ padding: "18px" }}>
      <div style={{ marginBottom: "14px" }}>
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9d8db8" }}>
          {title}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#7c6f96" }}>{subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#9d8db8" }}>No customers in this report yet.</p>
      ) : (
        <Table headers={["Customer", "Visits", "Total spent", "Outstanding", "Last activity"]}>
          {rows.map((row) => (
            <TR key={row.customerId}>
              <TD>
                <Link to={`/staff/customers/${row.customerId}`} style={{ color: "var(--purple-700)", textDecoration: "none", fontWeight: 500 }}>
                  {row.customerName}
                </Link>
                <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "#9d8db8" }}>{row.customerEmail}</p>
              </TD>
              <TD>{row.visitCount}</TD>
              <TD>Rs. {Number(row.totalSpent).toLocaleString()}</TD>
              <TD>
                <Badge color={row.outstandingBalance > 0 ? "red" : "green"}>
                  Rs. {Number(row.outstandingBalance).toLocaleString()}
                </Badge>
              </TD>
              <TD muted>
                {row.lastActivityUtc ? new Date(row.lastActivityUtc).toLocaleDateString() : "—"}
              </TD>
            </TR>
          ))}
        </Table>
      )}
    </Card>
  );
}

export default function CustomerReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportView, setReportView] = useState("pending");
  const [topFilter, setTopFilter] = useState("none");
  const [customerFilter, setCustomerFilter] = useState("all");

  useEffect(() => {
    customerReportsApi.get()
      .then(setReports)
      .catch((e) => toast.error(e.message || "Could not load reports."))
      .finally(() => setLoading(false));
  }, []);

  const safeReports = reports || {
    allCustomers: [],
    pendingCredits: [],
    highSpenders: [],
    regularCustomers: [],
  };

  const allCustomers = Array.isArray(safeReports.allCustomers) ? safeReports.allCustomers : [];

  const baseRows = useMemo(() => {
    switch (reportView) {
      case "high":
        return safeReports.highSpenders || [];
      case "regular":
        return safeReports.regularCustomers || [];
      case "all":
        return allCustomers;
      default:
        return safeReports.pendingCredits || [];
    }
  }, [reportView, safeReports, allCustomers]);

  const filteredRows = useMemo(() => {
    let rows = baseRows;
    if (customerFilter !== "all") {
      const id = Number(customerFilter);
      rows = rows.filter((row) => row.customerId === id);
    }

    if (topFilter === "topSpender" && rows.length > 0) {
      const top = rows.reduce((best, current) => (
        current.totalSpent > best.totalSpent ? current : best
      ));
      rows = [top];
    }

    if (topFilter === "topCustomer" && rows.length > 0) {
      const top = rows.reduce((best, current) => (
        current.visitCount > best.visitCount ? current : best
      ));
      rows = [top];
    }

    return rows;
  }, [baseRows, customerFilter, topFilter]);

  const reportTitle = useMemo(() => {
    switch (reportView) {
      case "high":
        return "High spenders";
      case "regular":
        return "Regular customers";
      case "all":
        return "All customers";
      default:
        return "Pending credits";
    }
  }, [reportView]);

  const reportSubtitle = useMemo(() => {
    switch (reportView) {
      case "high":
        return "Top customers by total invoiced amount";
      case "regular":
        return "Customers with 3 or more completed visits";
      case "all":
        return "All customers with activity and balances";
      default:
        return "Customers with unpaid invoice balances";
    }
  }, [reportView]);

  if (loading) return <Spinner />;
  if (!reports) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Customer Reports"
        subtitle="Regular customers, high spenders, and accounts with pending credits."
      />

      <Card style={{ padding: "16px", display: "grid", gap: "12px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#7c6f96" }}>
            Report type
            <select
              value={reportView}
              onChange={(e) => setReportView(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #e1d8f3", background: "white", minWidth: "180px" }}
            >
              <option value="pending">Pending credits</option>
              <option value="high">High spenders</option>
              <option value="regular">Regular customers</option>
              <option value="all">All customers</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#7c6f96" }}>
            Highlight
            <select
              value={topFilter}
              onChange={(e) => setTopFilter(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #e1d8f3", background: "white", minWidth: "180px" }}
            >
              <option value="none">All results</option>
              <option value="topSpender">Top spender</option>
              <option value="topCustomer">Top customer</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#7c6f96" }}>
            Customer
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #e1d8f3", background: "white", minWidth: "220px" }}
            >
              <option value="all">All customers</option>
              {allCustomers.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.customerName} ({customer.customerEmail})
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <ReportTable
        title={reportTitle}
        subtitle={reportSubtitle}
        rows={filteredRows}
      />
    </div>
  );
}
