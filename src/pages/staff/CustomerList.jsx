import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../services/api";
import { PageHeader, Button, Badge, Card, Spinner, EmptyState, Table, TR, TD } from "../../components/ui";

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

function CustomerRow({ customer, onView }) {
  return (
    <TR onClick={() => onView(customer.id)}>
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
        <button
          onClick={(e) => { e.stopPropagation(); onView(customer.id); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "12.5px", fontWeight: "500", color: "var(--purple-600)",
            padding: "4px 8px", borderRadius: "5px", fontFamily: "inherit",
          }}
        >
          View →
        </button>
      </TD>
    </TR>
  );
}

export function SearchCustomers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = useCallback(async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try { const data = await customerApi.search(q.trim()); setResults(data); }
    catch { setResults([]); }
    finally { setLoading(false); }
  }, [query]);

  return (
    <>
      <PageHeader title="Search" subtitle="Find customers by name, phone, ID, or vehicle plate" />

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9d8db8" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
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
              <Table headers={["Customer", "Phone", "Vehicles", "Registered", ""]}>
                {results.map((c) => (
                  <CustomerRow key={c.id} customer={c} onView={(id) => navigate(`/staff/customers/${id}`)} />
                ))}
              </Table>
            </>
          )}
        </Card>
      )}
    </>
  );
}

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    customerApi.getAll().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.vehicles?.some((v) => v.vehicleNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="All registered customers and their vehicles"
        action={
          <Button onClick={() => navigate("/staff/register-customer")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
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
          <Table headers={["Customer", "Phone", "Vehicles", "Registered", ""]}>
            {filtered.map((c) => (
              <CustomerRow key={c.id} customer={c} onView={(id) => navigate(`/staff/customers/${id}`)} />
            ))}
          </Table>
        )}
      </Card>

      {customers.length > 0 && (
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#9d8db8", textAlign: "right" }}>
          {filtered.length} of {customers.length} customers
        </p>
      )}
    </>
  );
}
