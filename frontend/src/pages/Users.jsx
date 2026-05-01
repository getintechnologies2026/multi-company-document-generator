import { useEffect, useState } from 'react';
import {
  Users, Plus, Edit, Trash2, Shield, Building2,
  ToggleLeft, ToggleRight, Key, ChevronDown, ChevronUp,
  BarChart2, FileText, CreditCard, TrendingUp, GraduationCap,
  Layers, CheckCircle, XCircle, Eye, EyeOff,
  UserCheck, AlertCircle, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const ROLES = ['super_admin', 'company_admin', 'hr', 'viewer'];

const ROLE_STYLE = {
  super_admin:   { bg: 'bg-purple-100', text: 'text-purple-700',  dot: 'bg-purple-500',  label: 'Super Admin' },
  company_admin: { bg: 'bg-blue-100',   text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Company Admin' },
  hr:            { bg: 'bg-emerald-100',text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'HR' },
  viewer:        { bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400',    label: 'Viewer' },
};

const FEATURES = [
  { key: 'view_dashboard',     label: 'Dashboard',         icon: BarChart2,      color: 'text-blue-500' },
  { key: 'manage_companies',   label: 'Manage Companies',  icon: Building2,      color: 'text-violet-500' },
  { key: 'manage_employees',   label: 'Manage Employees',  icon: Users,          color: 'text-emerald-500' },
  { key: 'generate_documents', label: 'Single Document',   icon: FileText,       color: 'text-orange-500' },
  { key: 'generate_all',       label: 'Generate All',      icon: Layers,         color: 'text-pink-500' },
  { key: 'salary_increment',   label: 'Increment Letter',  icon: TrendingUp,     color: 'text-teal-500' },
  { key: 'bulk_payslips',      label: 'Bulk Payslips',     icon: CreditCard,     color: 'text-amber-500' },
  { key: 'internship_cert',    label: 'Internship Cert',   icon: GraduationCap,  color: 'text-purple-500' },
  { key: 'view_documents',     label: 'View Documents',    icon: Eye,            color: 'text-rose-500' },
];

const DEFAULT_PERMS = Object.fromEntries(FEATURES.map(f => [f.key, true]));

const blankForm = () => ({
  name: '', email: '', password: '', role: 'hr',
  company_id: '', is_active: 1, permissions: { ...DEFAULT_PERMS },
});

export default function UsersPage() {
  const { user: currentUser }     = useAuth();
  const [list, setList]           = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats]         = useState([]);
  const [modal, setModal]         = useState(null);   // null | 'create' | editUser
  const [confirmDel, setConfirmDel] = useState(null); // { id } when open
  const [form, setForm]           = useState(blankForm());
  const [saving, setSaving]       = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [expanded, setExpanded]   = useState(null);
  const [tab, setTab]             = useState('users'); // 'users' | 'activity'

  // Restriction helpers
  const superAdminCount = list.filter(u => u.role === 'super_admin').length;
  const isSelf       = (u) => u.id === currentUser?.id;
  const isLastAdmin  = (u) => u.role === 'super_admin' && superAdminCount <= 1;
  const canDelete    = (u) => !isSelf(u) && !isLastAdmin(u);
  const canEdit      = (u) => true; // can always open edit; role-change on self is restricted inside modal
  const deleteTooltip = (u) => {
    if (isSelf(u))      return 'Cannot delete your own account';
    if (isLastAdmin(u)) return 'Cannot delete the only Super Admin';
    return 'Delete user';
  };

  const load = async () => {
    const [u, c, s] = await Promise.all([
      api.get('/users'),
      api.get('/companies'),
      api.get('/users/stats'),
    ]);
    setList(u.data);
    setCompanies(c.data);
    setStats(s.data);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(blankForm());
    setShowPass(false);
    setModal('create');
  };

  const openEdit = (u) => {
    setForm({
      name: u.name, email: u.email, password: '',
      role: u.role, company_id: u.company_id || '',
      is_active: u.is_active,
      permissions: { ...DEFAULT_PERMS, ...(u.permissions || {}) },
    });
    setShowPass(false);
    setModal(u);
  };

  const handleRoleChange = (role) => {
    const newPerms = role === 'super_admin'
      ? Object.fromEntries(FEATURES.map(f => [f.key, true]))
      : role === 'viewer'
        ? { ...DEFAULT_PERMS, manage_companies: false, manage_employees: false,
            generate_documents: false, generate_all: false, salary_increment: false,
            bulk_payslips: false, internship_cert: false }
        : { ...form.permissions };
    setForm(f => ({ ...f, role, permissions: newPerms }));
  };

  const togglePerm = (key) => {
    if (form.role === 'super_admin') return; // super_admin always has all
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  };

  const save = async () => {
    if (!form.name || !form.email) return toast.error('Name and email are required');
    if (modal === 'create' && !form.password) return toast.error('Password is required');
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, role: form.role,
        company_id: form.company_id || null,
        is_active: form.is_active,
        permissions: form.permissions,
      };
      if (form.password) payload.password = form.password;

      if (modal === 'create') {
        await api.post('/users', payload);
        toast.success('User created successfully');
      } else {
        await api.put(`/users/${modal.id}`, payload);
        toast.success('User updated successfully');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const id = confirmDel?.id;
    setConfirmDel(null);
    if (!id) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { is_active: u.is_active ? 0 : 1 });
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
      load();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const activeCount = list.filter(u => u.is_active).length;

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)' }}>

      {/* Header */}
      <div className="px-6 py-5 mb-6 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb)' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Shield size={20} /> User Management
            </h1>
            <p className="text-purple-200 text-xs mt-0.5">
              {list.length} users · {activeCount} active · Super Admin Portal
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition">
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-5">

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
          <button onClick={() => setTab('users')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${tab === 'users' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center gap-1.5"><Users size={13} /> Users</span>
          </button>
          <button onClick={() => setTab('activity')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${tab === 'activity' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center gap-1.5"><BarChart2 size={13} /> Document Activity</span>
          </button>
        </div>

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {list.length === 0 ? (
              <div className="py-20 text-center">
                <Users size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-semibold">No users yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {list.map(u => {
                  const rs = ROLE_STYLE[u.role] || ROLE_STYLE.hr;
                  const perms = u.permissions || DEFAULT_PERMS;
                  const enabledCount = Object.values(perms).filter(Boolean).length;
                  const isExpanded = expanded === u.id;

                  return (
                    <div key={u.id} className="hover:bg-gray-50/60 transition">
                      <div className="flex items-center gap-3 px-5 py-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm text-white shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-gray-800 text-sm">{u.name}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${rs.bg} ${rs.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`} />
                              {rs.label}
                            </span>
                            {!u.is_active && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                          {u.company_name && (
                            <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                              <Building2 size={9} /> {u.company_name}
                            </p>
                          )}
                        </div>

                        {/* Permissions summary */}
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400 font-medium">{enabledCount}/{FEATURES.length} features</span>
                          <div className="flex gap-0.5">
                            {FEATURES.slice(0, 6).map(f => (
                              <div key={f.key}
                                className={`w-2 h-2 rounded-full ${perms[f.key] ? 'bg-emerald-400' : 'bg-gray-200'}`}
                                title={f.label} />
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => setExpanded(isExpanded ? null : u.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="View permissions">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button onClick={() => !isSelf(u) && toggleActive(u)}
                            disabled={isSelf(u)}
                            className={`p-1.5 rounded-lg transition ${
                              isSelf(u) ? 'text-gray-300 cursor-not-allowed' :
                              u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                            title={isSelf(u) ? 'Cannot deactivate yourself' : u.is_active ? 'Deactivate' : 'Activate'}>
                            {u.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition"
                            title="Edit user">
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => canDelete(u) && setConfirmDel({ id: u.id })}
                            disabled={!canDelete(u)}
                            title={deleteTooltip(u)}
                            className={`p-1.5 rounded-lg transition ${
                              canDelete(u)
                                ? 'text-red-400 hover:bg-red-50 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed'}`}>
                            {canDelete(u) ? <Trash2 size={14} /> : <Lock size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded permissions */}
                      {isExpanded && (
                        <div className="px-5 pb-4 bg-gray-50/50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Feature Access</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {FEATURES.map(f => {
                              const Icon = f.icon;
                              const on = !!perms[f.key];
                              return (
                                <div key={f.key}
                                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium
                                    ${on ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-400'}`}>
                                  <Icon size={11} className={on ? f.color : 'text-gray-300'} />
                                  <span className="truncate">{f.label}</span>
                                  {on ? <CheckCircle size={10} className="shrink-0 text-emerald-500" />
                                       : <XCircle size={10} className="shrink-0 text-gray-300" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === 'activity' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <BarChart2 size={16} className="text-purple-500" />
              <h2 className="font-black text-sm text-gray-800">Documents Generated by User</h2>
            </div>
            {stats.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No document activity yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.map((s, i) => {
                  const rs = ROLE_STYLE[s.role] || ROLE_STYLE.hr;
                  const maxCount = Math.max(...stats.map(x => x.doc_count), 1);
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition">
                      <span className="text-sm font-black text-gray-300 w-5 text-right">{i + 1}</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-800 truncate">{s.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${rs.bg} ${rs.text}`}>{rs.label}</span>
                        </div>
                        {s.last_generated && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Last: {new Date(s.last_generated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-32 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${(s.doc_count / maxCount) * 100}%` }} />
                        </div>
                        <span className="text-sm font-black text-purple-700 w-8 text-right">{s.doc_count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-black text-gray-800 flex items-center gap-2">
                {modal === 'create' ? <Plus size={16} className="text-purple-600" /> : <Edit size={16} className="text-blue-600" />}
                {modal === 'create' ? 'Create New User' : `Edit: ${modal.name}`}
                {modal !== 'create' && isSelf(modal) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">You</span>
                )}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5">

              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Full Name *</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email *</label>
                  <input type="email"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="user@company.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  {modal === 'create' ? 'Password *' : 'New Password (leave blank to keep current)'}
                </label>
                <div className="relative">
                  <Key size={13} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="w-full pl-8 pr-9 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder={modal === 'create' ? 'Enter password' : 'Leave blank to keep'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Role + Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    Role *
                    {modal !== 'create' && isSelf(modal) && (
                      <span className="ml-1 text-[9px] font-bold text-amber-600 normal-case">(locked — cannot change own role)</span>
                    )}
                  </label>
                  <select
                    className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 ${modal !== 'create' && isSelf(modal) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={form.role}
                    disabled={modal !== 'create' && isSelf(modal)}
                    onChange={e => handleRoleChange(e.target.value)}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_STYLE[r]?.label || r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Company</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={form.company_id}
                    onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
                    <option value="">All Companies</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">Account Active</span>
                </div>
                <button onClick={() => setForm(f => ({ ...f, is_active: f.is_active ? 0 : 1 }))}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full transition ${
                    form.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                  {form.is_active ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Inactive</>}
                </button>
              </div>

              {/* Feature Permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Feature Access</label>
                  {form.role === 'super_admin' && (
                    <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
                      <Shield size={10} /> Super Admin has all access
                    </span>
                  )}
                </div>
                {form.role !== 'super_admin' && (
                  <div className="flex gap-2 mb-2.5">
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, permissions: Object.fromEntries(FEATURES.map(x => [x.key, true])) }))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition">
                      ✓ Enable All
                    </button>
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, permissions: Object.fromEntries(FEATURES.map(x => [x.key, false])) }))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition">
                      ✕ Disable All
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map(f => {
                    const Icon = f.icon;
                    const on = form.role === 'super_admin' ? true : !!form.permissions[f.key];
                    return (
                      <button key={f.key} type="button"
                        onClick={() => togglePerm(f.key)}
                        disabled={form.role === 'super_admin'}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition
                          ${on
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}
                          ${form.role === 'super_admin' ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
                        <Icon size={13} className={on ? f.color : 'text-gray-300'} />
                        <span className="flex-1 truncate">{f.label}</span>
                        {on
                          ? <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                          : <XCircle size={12} className="text-gray-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role info */}
              {form.role !== 'super_admin' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Toggle feature switches above to control exactly what this user can access.
                    Changes take effect on next login.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  {saving ? 'Saving...' : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDel}
        title="Delete User?"
        message="This will permanently delete the user account. Any documents they generated will remain. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={remove}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
