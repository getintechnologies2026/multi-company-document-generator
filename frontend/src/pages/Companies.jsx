import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Companies() {
  const [list, setList] = useState([]);

  const load = () => api.get('/companies').then(({ data }) => setList(data));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this company?')) return;
    await api.delete(`/companies/${id}`);
    toast.success('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Link to="/companies/new" className="btn btn-primary flex items-center gap-2"><Plus size={18} /> Add Company</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Logo</th>
              <th className="table-th">Name</th>
              <th className="table-th">City</th>
              <th className="table-th">Email</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td className="table-td">
                  {c.logo_path
                    ? <img src={`/uploads/${c.logo_path}`} className="h-10 w-10 object-contain" />
                    : <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs">{c.name?.[0]}</div>}
                </td>
                <td className="table-td font-medium">{c.name}</td>
                <td className="table-td">{c.city}</td>
                <td className="table-td">{c.email}</td>
                <td className="table-td">{c.phone}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <Link to={`/companies/${c.id}/edit`} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></Link>
                    <button onClick={() => remove(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="table-td text-center text-gray-400">No companies yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
