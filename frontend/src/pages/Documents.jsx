import { useEffect, useState } from 'react';
import { Trash2, Download, Eye, Search, FileText, CreditCard, Award, LogOut, TrendingUp, Sparkles, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const TYPE_META = {
  offer_letter:      { label: 'Offer Letter',        icon: Sparkles,    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  payslip:           { label: 'Payslip',              icon: CreditCard,  bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-400' },
  experience_letter: { label: 'Experience Letter',    icon: Award,       bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  relieving_letter:  { label: 'Relieving Letter',     icon: LogOut,      bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400' },
  salary_increment:        { label: 'Increment Letter',     icon: TrendingUp,    bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-400' },
  internship_certificate:  { label: 'Internship Certificate', icon: GraduationCap, bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-400' },
};

const STATS_COLORS = {
  offer_letter: '#3b82f6', payslip: '#10b981', experience_letter: '#f59e0b',
  relieving_letter: '#ef4444', salary_increment: '#0d9488', internship_certificate: '#7c3aed'
};

export default function Documents() {
  const [list, setList]         = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters]   = useState({ company_id: '', doc_type: '', search: '' });
  const [stats, setStats]       = useState({});

  const load = async () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    const { data } = await api.get('/documents', { params });
    setList(data);

    // Build per-type count from fetched list
    const s = {};
    data.forEach(d => { s[d.doc_type] = (s[d.doc_type] || 0) + 1; });
    setStats(s);
  };

  useEffect(() => { api.get('/companies').then(({ data }) => setCompanies(data)); }, []);
  useEffect(() => { load(); }, [filters]);

  const remove = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    toast.success('Deleted');
    load();
  };

  const TypeBadge = ({ type }) => {
    const m = TYPE_META[type] || { label: type, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
    const Icon = m.icon || FileText;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}>
        <Icon size={11} />
        {m.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)' }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-5 mb-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText size={22} /> Documents History</h1>
            <p className="text-gray-300 text-sm mt-0.5">All generated documents — view, download or delete</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{list.length}</div>
            <div className="text-gray-400 text-xs">total documents</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-5">

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(TYPE_META).map(([key, m]) => {
            const Icon = m.icon;
            const count = stats[key] || 0;
            return (
              <div key={key} className={`bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3 cursor-pointer transition hover:shadow-md
                ${filters.doc_type === key ? 'ring-2 ring-offset-1' : ''}`}
                style={{ '--tw-ring-color': STATS_COLORS[key] }}
                onClick={() => setFilters(f => ({ ...f, doc_type: f.doc_type === key ? '' : key }))}>
                <div className={`p-2 rounded-lg ${m.bg}`}><Icon size={16} className={m.text} /></div>
                <div>
                  <div className="text-lg font-bold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-500 leading-tight">{m.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                <input className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Doc number or employee name..."
                  value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Document Type</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filters.doc_type} onChange={e => setFilters({ ...filters, doc_type: e.target.value })}>
                <option value="">All Types</option>
                {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Company</label>
              <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={filters.company_id} onChange={e => setFilters({ ...filters, company_id: e.target.value })}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {(filters.doc_type || filters.company_id || filters.search) && (
            <button onClick={() => setFilters({ company_id: '', doc_type: '', search: '' })}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Doc Number</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">{d.doc_number}</td>
                    <td className="px-4 py-3"><TypeBadge type={d.doc_type} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.employee_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <a href={`/generated/${d.pdf_path}`} target="_blank" rel="noreferrer"
                          className="text-blue-500 hover:text-blue-700 transition" title="View PDF">
                          <Eye size={16} />
                        </a>
                        <a href={`/generated/${d.pdf_path}`} download
                          className="text-emerald-500 hover:text-emerald-700 transition" title="Download">
                          <Download size={16} />
                        </a>
                        <button onClick={() => remove(d.id)}
                          className="text-red-400 hover:text-red-600 transition" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-16 text-center">
                      <FileText size={40} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400 font-medium">No documents yet</p>
                      <p className="text-gray-300 text-sm">Generate your first document from the sidebar</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
