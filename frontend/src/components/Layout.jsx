import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileText, FilePlus,
  Layers, CreditCard, Calculator, LogOut, TrendingUp, GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',                           label: 'Dashboard',           icon: LayoutDashboard, end: true,  color: 'text-blue-300' },
  { to: '/companies',                  label: 'Companies',           icon: Building2,                   color: 'text-violet-300' },
  { to: '/employees',                  label: 'Employees',           icon: Users,                       color: 'text-emerald-300' },
  { to: '/generate-all',               label: 'Generate All',        icon: Layers,                      color: 'text-pink-300' },
  { to: '/generate/salary_increment',  label: 'Increment Letter',    icon: TrendingUp,                  color: 'text-teal-300' },
  { to: '/bulk-payslips',              label: 'Bulk Payslips',       icon: CreditCard,                  color: 'text-amber-300' },
  { to: '/tn-salary',                  label: 'TN Salary Calc',      icon: Calculator,                  color: 'text-cyan-300' },
  { to: '/internship-certificate',     label: 'Internship Cert',     icon: GraduationCap,               color: 'text-purple-300' },
  { to: '/generate',                   label: 'Single Document',     icon: FilePlus,                    color: 'text-orange-300' },
  { to: '/documents',                  label: 'Documents',           icon: FileText,                    color: 'text-rose-300' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className="w-48 flex-shrink-0 flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>

        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
              <FileText size={13} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">Docs Gen</h1>
              <p className="text-[9px] text-indigo-300 leading-tight">Doc Generator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label, icon: Icon, end, color }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`
              }>
              {({ isActive }) => (
                <>
                  <Icon size={14} className={isActive ? 'text-white' : color} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-indigo-300 capitalize truncate">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:text-white border border-white/15 hover:border-red-400 hover:bg-red-500/20 transition">
            <LogOut size={11} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
