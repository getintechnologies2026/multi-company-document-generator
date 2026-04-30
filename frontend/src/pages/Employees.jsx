import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Employees() {
  const [list, setList] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ company_id: '', search: '' });

  const load = async () => {
    const params = {};
    if (filters.company_id) params.company_id = filters.company_id;
    if (filters.search) params.search = filters.search;
    const { data } = await api.get('/employees', { params });
    setList(data);
  };

  useEffect(() => {
    api.get('/companies').then(({ data }) => setCompanies(data));
  }, []);
  useEffect(() => { load(); }, [filters]);

  const remove = async (id) => {
    if (!confirm('Delete this employee?')) return;
    await api.delete(`/employees/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link to="/employees/new" className="btn btn-primary flex items-center gap-2"><Plus size={18} /> Add Employee</Link>
      </div>
      <div className="card mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-2 top-3 text-gray-400" />
            <input className="input pl-8" placeholder="Name, code, email..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
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
              <th className="table-th">Code</th>
              <th className="table-th">Name</th>
              <th className="table-th">Designation</th>
              <th className="table-th">Company</th>
              <th className="table-th">DOJ</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td className="table-td font-mono text-xs">{e.emp_code}</td>
                <td className="table-td font-medium">{e.full_name}</td>
                <td className="table-td">{e.designation}</td>
                <td className="table-td">{e.company_name}</td>
                <td className="table-td">{e.date_of_joining ? new Date(e.date_of_joining).toLocaleDateString() : '-'}</td>
                <td className="table-td">
                  <span className={`px-2 py-0.5 rounded text-xs ${e.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{e.status}</span>
                </td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <Link to={`/employees/${e.id}/edit`} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></Link>
                    <button onClick={() => remove(e.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="7" className="table-td text-center text-gray-400">No employees found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
