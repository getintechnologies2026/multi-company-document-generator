import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Users, Building2, Briefcase, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-purple-500',
  'from-teal-500 to-emerald-500',
];

const STATUS_STYLE = {
  Active:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  Resigned:    { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  Terminated:  { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400'     },
};

const EMP_TYPE_STYLE = {
  'Full-Time': { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'Part-Time': { bg: 'bg-violet-100', text: 'text-violet-700' },
  'Contract':  { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Intern':    { bg: 'bg-pink-100',   text: 'text-pink-700'   },
};

export default function Employees() {
  const [list, setList]           = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters]     = useState({ company_id: '', search: '' });

  const load = async () => {
    const params = {};
    if (filters.company_id) params.company_id = filters.company_id;
    if (filters.search) params.search = filters.search;
    const { data } = await api.get('/employees', { params });
    setList(data);
  };

  useEffect(() => { api.get('/companies').then(({ data }) => setCompanies(data)); }, []);
  useEffect(() => { load(); }, [filters]);

  const remove = async (id) => {
    if (!confirm('Delete this employee?')) return;
    await api.delete(`/employees/${id}`);
    toast.success('Employee deleted');
    load();
  };

  const activeCount   = list.filter(e => e.status === 'Active').length;
  const resignedCount = list.filter(e => e.status === 'Resigned' || e.status === 'Terminated').length;

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)' }}>

      {/* Header */}
      <div className="px-6 py-5 mb-6 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #059669, #0d9488, #0891b2)' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Users size={20} /> Employees
            </h1>
            <p className="text-emerald-200 text-xs mt-0.5">{list.length} total · {activeCount} active · {resignedCount} inactive</p>
          </div>
          <Link to="/employees/new"
            className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition">
            <Plus size={16} /> Add Employee
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-4">

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-3 text-gray-400" />
                <input
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  placeholder="Name, code, email..."
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Company</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3 top-3 text-gray-400" />
                <select
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  value={filters.company_id}
                  onChange={e => setFilters({ ...filters, company_id: e.target.value })}>
                  <option value="">All Companies</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          {(filters.search || filters.company_id) && (
            <button onClick={() => setFilters({ company_id: '', search: '' })}
              className="mt-3 text-xs text-emerald-600 hover:text-emerald-800 font-medium">
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Empty State */}
        {list.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-emerald-400" />
            </div>
            <p className="text-gray-500 font-semibold">No employees found</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">
              {filters.search || filters.company_id ? 'Try adjusting your filters' : 'Add your first employee to get started'}
            </p>
            {!filters.search && !filters.company_id && (
              <Link to="/employees/new"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition">
                <Plus size={15} /> Add Employee
              </Link>
            )}
          </div>
        )}

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((e, i) => {
            const grad    = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const status  = STATUS_STYLE[e.status]  || STATUS_STYLE['Active'];
            const empType = EMP_TYPE_STYLE[e.employment_type] || { bg: 'bg-gray-100', text: 'text-gray-600' };
            const initials = e.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

            return (
              <div key={e.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">

                {/* Top gradient strip */}
                <div className={`h-1.5 bg-gradient-to-r ${grad}`} />

                <div className="p-4">
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md shrink-0`}>
                      <span className="text-white text-sm font-black">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-800 text-sm truncate">{e.full_name}</h3>
                      <p className="text-xs text-gray-500 truncate">{e.designation || '—'}</p>
                      {e.emp_code && (
                        <span className="text-[10px] font-mono text-gray-400">{e.emp_code}</span>
                      )}
                    </div>
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text} shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {e.status}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Building2 size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Company</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 truncate">{e.company_name || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Briefcase size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Dept</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 truncate">{e.department || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Joined</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700">
                        {e.date_of_joining ? new Date(e.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg px-2.5 py-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Users size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Type</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${empType.bg} ${empType.text}`}>
                        {e.employment_type || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link to={`/employees/${e.id}/edit`}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r ${grad} text-white hover:opacity-90 transition shadow-sm`}>
                      <Edit size={12} /> Edit
                    </Link>
                    <button onClick={() => remove(e.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
