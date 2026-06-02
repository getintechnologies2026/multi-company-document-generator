import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import CompanyForm from './pages/CompanyForm';
import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';
import Generate from './pages/Generate';
import GenerateAll from './pages/GenerateAll';
import BulkPayslips from './pages/BulkPayslips';
import Documents from './pages/Documents';
import InternshipCertificate from './pages/InternshipCertificate';
import UsersPage from './pages/Users';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'super_admin') return <Navigate to="/" />;
  return children;
}

// Blocks access to a route if user lacks the required permission(s).
// permKey can be a string or an array — user needs at least one of them.
// super_admin bypasses all checks via hasPermission().
function PermissionRoute({ permKey, children }) {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const keys = Array.isArray(permKey) ? permKey : [permKey];
  if (!keys.some(k => hasPermission(k))) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="companies"          element={<PermissionRoute permKey="manage_companies"><Companies /></PermissionRoute>} />
        <Route path="companies/new"      element={<PermissionRoute permKey="manage_companies"><CompanyForm /></PermissionRoute>} />
        <Route path="companies/:id/edit" element={<PermissionRoute permKey="manage_companies"><CompanyForm /></PermissionRoute>} />
        <Route path="employees"          element={<PermissionRoute permKey="manage_employees"><Employees /></PermissionRoute>} />
        <Route path="employees/new"      element={<PermissionRoute permKey="manage_employees"><EmployeeForm /></PermissionRoute>} />
        <Route path="employees/:id/edit" element={<PermissionRoute permKey="manage_employees"><EmployeeForm /></PermissionRoute>} />
        <Route path="generate-all"       element={<PermissionRoute permKey="generate_all"><GenerateAll /></PermissionRoute>} />
        <Route path="bulk-payslips"      element={<PermissionRoute permKey="bulk_payslips"><BulkPayslips /></PermissionRoute>} />
        <Route path="generate"           element={<PermissionRoute permKey="generate_documents"><Generate /></PermissionRoute>} />
        <Route path="generate/:type"     element={<PermissionRoute permKey={['generate_documents', 'salary_increment']}><Generate /></PermissionRoute>} />
        <Route path="documents"          element={<PermissionRoute permKey="view_documents"><Documents /></PermissionRoute>} />
        <Route path="internship-certificate" element={<PermissionRoute permKey="internship_cert"><InternshipCertificate /></PermissionRoute>} />
        <Route path="users"              element={<AdminRoute><UsersPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
