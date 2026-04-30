import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FileText, FilePlus, Layers, CreditCard, Calculator, LogOut, TrendingUp, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/companies', label: 'Companies', icon: Building2 },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/generate-all', label: 'Generate All Docs', icon: Layers },
    { to: '/generate/salary_increment', label: 'Increment Letter', icon: TrendingUp },
    { to: '/bulk-payslips', label: 'Bulk Payslips', icon: CreditCard },
    { to: '/tn-salary', label: 'TN Salary Calc', icon: Calculator },
    { to: '/internship-certificate', label: 'Internship Certificate', icon: GraduationCap },
    { to: '/generate', label: 'Single Document', icon: FilePlus },
    { to: '/documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-5 border-b border-brand-800">
          <h1 className="text-xl font-bold">DocSoft</h1>
          <p className="text-xs text-blue-200">Multi-Company Generator</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded transition ${
                  isActive ? 'bg-brand-700' : 'hover:bg-brand-800'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-brand-800">
          <div className="text-sm font-medium">{user?.name}</div>
          <div className="text-xs text-blue-200 capitalize">{user?.role?.replace('_', ' ')}</div>
          <button onClick={logout} className="mt-2 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm py-1.5 rounded">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
