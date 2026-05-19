import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import CustomerLayout from "./components/CustomerLayout";
import Login from "./pages/Login";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerVerifyEmail from "./pages/CustomerVerifyEmail";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerVehicles from "./pages/customer/CustomerVehicles";
import CustomerAppointments from "./pages/customer/CustomerAppointments";
import CustomerParts from "./pages/customer/CustomerParts";
import CustomerPartRequests from "./pages/customer/CustomerPartRequests";
import CustomerHistory from "./pages/customer/CustomerHistory";
import StaffManagement from "./pages/admin/StaffManagement";
import VendorManagement from "./pages/admin/VendorManagement";
import PartsManagement from "./pages/admin/PartsManagement";
import PurchaseInvoices from "./pages/admin/PurchaseInvoices";
import FinancialReports from "./pages/admin/FinancialReports";
import RegisterCustomer from "./pages/staff/RegisterCustomer";
import CustomerList, { SearchCustomers } from "./pages/staff/CustomerList";
import CustomerDetail from "./pages/staff/CustomerDetail";
import Appointments from "./pages/staff/Appointments";
import BookAppointment from "./pages/staff/BookAppointment";
import CustomerPartOrders from "./pages/staff/CustomerPartOrders";
import PartRequests from "./pages/staff/PartRequests";
import RequestPart from "./pages/staff/RequestPart";
import ReviewService from "./pages/staff/ReviewService";

function StaffRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "Customer") return <Navigate to="/customer/dashboard" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/customer-login" replace />;
  if (user.role !== "Customer") {
    return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  if (user.role === "Customer") return <Navigate to="/customer/dashboard" replace />;
  return <Navigate to={user.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />;
}

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
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/customer-login" element={<PublicRoute><CustomerLogin /></PublicRoute>} />
      <Route path="/customer-register" element={<PublicRoute><CustomerRegister /></PublicRoute>} />
      <Route path="/customer/verify-email" element={<CustomerVerifyEmail />} />
      <Route path="/verify-email/staff" element={<CustomerVerifyEmail type="staff" />} />

      <Route path="/customer" element={<CustomerRoute><CustomerLayout /></CustomerRoute>}>
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="vehicles" element={<CustomerVehicles />} />
        <Route path="appointments" element={<CustomerAppointments />} />
        <Route path="parts" element={<CustomerParts />} />
        <Route path="part-requests" element={<CustomerPartRequests />} />
        <Route path="history" element={<CustomerHistory />} />
      </Route>

      <Route path="/" element={<StaffRoute><Layout /></StaffRoute>}>
        <Route index element={
          <Navigate to={user?.role === "Admin" ? "/admin/staff" : "/staff/customers"} replace />
        } />

        {/* Admin only */}
        <Route path="admin/staff" element={<AdminRoute><StaffManagement /></AdminRoute>} />
        <Route path="admin/vendors" element={<AdminRoute><VendorManagement /></AdminRoute>} />
        <Route path="admin/parts" element={<AdminRoute><PartsManagement /></AdminRoute>} />
        <Route path="admin/part-requests" element={<AdminRoute><PartRequests /></AdminRoute>} />
        <Route path="admin/invoices" element={<AdminRoute><PurchaseInvoices /></AdminRoute>} />
        <Route path="admin/reports" element={<AdminRoute><FinancialReports /></AdminRoute>} />

        {/* Staff + Admin */}
        <Route path="staff/register-customer" element={<RegisterCustomer />} />
        <Route path="staff/customers" element={<CustomerList />} />
        <Route path="staff/customers/:id" element={<CustomerDetail />} />
        <Route path="staff/appointments" element={<Appointments />} />
        <Route path="staff/part-orders" element={<CustomerPartOrders />} />
        <Route path="staff/part-requests" element={<PartRequests />} />
        <Route path="staff/customers/:id/book-appointment" element={<BookAppointment />} />
        <Route path="staff/customers/:id/request-part" element={<RequestPart />} />
        <Route path="staff/customers/:id/review-service" element={<ReviewService />} />
        <Route path="staff/search" element={<SearchCustomers />} />
      </Route>

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
