import { useEffect, useState } from 'react';
import { Trash2, Download, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const TYPE_LABELS = {
  offer_letter: 'Offer Letter',
  payslip: 'Payslip',
  experience_letter: 'Experience Letter',
  relieving_letter: 'Relieving Letter'
};

export default function Documents() {
  const [list, setList] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ company_id: '', doc_type: '', search: '' });

  const load = async () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    const { data } = await api.get('/documents', { params });
    setList(data);
  };

  useEffect(() => { api.get('/companies').then(({ data }) => setCompanies(data)); }, []);
  useEffect(() => { load(); }, [filters]);

  const remove = async (id) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Documents History</h1>

      <div className="card mb-4 grid md:grid-cols-3 gap-3">
        <div>
          <label className="label">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-2 top-3 text-gray-400" />
            <input className="input pl-8" placeholder="Doc number or employee..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={filters.doc_type} onChange={(e) => setFilters({ ...filters, doc_type: e.target.value })}>
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Company</label>
          <select className="input" value={filters.company_id} onChange={(e) => setFilters({ ...filters, company_id: e.target.value })}>
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Doc Number</th>
              <th className="table-th">Type</th>
              <th className="table-th">Employee</th>
              <th className="table-th">Company</th>
              <th className="table-th">Date</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id}>
                <td className="table-td font-mono text-xs">{d.doc_number}</td>
                <td className="table-td">
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                    {TYPE_LABELS[d.doc_type]}
                  </span>
                </td>
                <td className="table-td">{d.employee_name}</td>
                <td className="table-td">{d.company_name}</td>
                <td className="table-td">{new Date(d.created_at).toLocaleDateString()}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <a href={`/generated/${d.pdf_path}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800" title="View"><Eye size={16} /></a>
                    <a href={`/generated/${d.pdf_path}`} download className="text-green-600 hover:text-green-800" title="Download"><Download size={16} /></a>
                    <button onClick={() => remove(d.id)} className="text-red-600 hover:text-red-800" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="table-td text-center text-gray-400 py-8">No documents yet — generate your first one!</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
