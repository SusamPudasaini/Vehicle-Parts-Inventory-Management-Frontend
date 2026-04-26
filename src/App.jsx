import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import StaffManagement from "./pages/admin/StaffManagement";
import VendorManagement from "./pages/admin/VendorManagement";
import RegisterCustomer from "./pages/staff/RegisterCustomer";
import CustomerList, { SearchCustomers } from "./pages/staff/CustomerList";
import CustomerDetail from "./pages/staff/CustomerDetail";

// Redirect to login if not authenticated
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Redirect to correct home if already logged in
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
}

// Only admins can access this route
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "Admin") return <Navigate to="/staff/customers" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Protected */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={
          <Navigate to={user?.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />
        } />

        {/* Admin only */}
        <Route path="admin/staff" element={<AdminRoute><StaffManagement /></AdminRoute>} />
        <Route path="admin/vendors" element={<AdminRoute><VendorManagement /></AdminRoute>} />

        {/* Staff + Admin */}
        <Route path="staff/register-customer" element={<RegisterCustomer />} />
        <Route path="staff/customers" element={<CustomerList />} />
        <Route path="staff/customers/:id" element={<CustomerDetail />} />
        <Route path="staff/search" element={<SearchCustomers />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
