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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/new" element={<CompanyForm />} />
        <Route path="companies/:id/edit" element={<CompanyForm />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="generate-all" element={<GenerateAll />} />
        <Route path="bulk-payslips" element={<BulkPayslips />} />
        <Route path="generate" element={<Generate />} />
        <Route path="generate/:type" element={<Generate />} />
        <Route path="documents" element={<Documents />} />
        <Route path="internship-certificate" element={<InternshipCertificate />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
