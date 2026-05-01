import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Building2, MapPin, Mail, Phone, Globe, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-teal-500 to-emerald-600',
];

const BG_LIGHTS = [
  'bg-violet-50 border-violet-100',
  'bg-blue-50 border-blue-100',
  'bg-emerald-50 border-emerald-100',
  'bg-orange-50 border-orange-100',
  'bg-rose-50 border-rose-100',
  'bg-cyan-50 border-cyan-100',
  'bg-fuchsia-50 border-fuchsia-100',
  'bg-teal-50 border-teal-100',
];

export default function Companies() {
  const [list, setList]       = useState([]);
  const [confirm, setConfirm] = useState(null); // { id } when open

  const load = () => api.get('/companies').then(({ data }) => setList(data));
  useEffect(() => { load(); }, []);

  const remove = async () => {
    const id = confirm?.id;
    setConfirm(null);
    if (!id) return;
    try {
      await api.delete(`/companies/${id}`);
      toast.success('Company deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>

      {/* Header */}
      <div className="px-5 py-3.5 mb-4 shadow-md"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              <Building2 size={17} /> Companies
            </h1>
            <p className="text-indigo-200 text-[11px] mt-0.5">{list.length} registered {list.length === 1 ? 'company' : 'companies'}</p>
          </div>
          <Link to="/companies/new"
            className="flex items-center gap-1.5 bg-white text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-lg font-bold text-xs shadow-lg transition">
            <Plus size={14} /> Add Company
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">

        {/* Empty state */}
        {list.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-indigo-400" />
            </div>
            <p className="text-gray-500 font-semibold">No companies yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">Add your first company to get started</p>
            <Link to="/companies/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition">
              <Plus size={15} /> Add First Company
            </Link>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {list.map((c, i) => {
            const grad = GRADIENTS[i % GRADIENTS.length];
            const bgLight = BG_LIGHTS[i % BG_LIGHTS.length];
            const initial = c.name?.[0]?.toUpperCase() || '?';

            return (
              <div key={c.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5`}>

                {/* Card top gradient bar */}
                <div className={`bg-gradient-to-r ${grad} h-1`} />

                {/* Card Body */}
                <div className="p-3.5">
                  {/* Logo + Name row */}
                  <div className="flex items-center gap-2.5 mb-3">
                    {c.logo_path ? (
                      <img src={`/uploads/${c.logo_path}`}
                        className="w-9 h-9 object-contain rounded-lg border border-gray-100 shadow-sm bg-white p-0.5 shrink-0" />
                    ) : (
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm shrink-0`}>
                        <span className="text-white text-sm font-black">{initial}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-800 text-xs leading-tight truncate">{c.name}</h3>
                      {c.doc_number_prefix && (
                        <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${grad} text-white`}>
                          {c.doc_number_prefix}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className={`${bgLight} rounded-lg px-2.5 py-2 space-y-1.5 border text-[11px] mb-3`}>
                    {c.city && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={10} className="text-gray-400 shrink-0" />
                        <span className="truncate">{[c.city, c.state].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail size={10} className="text-gray-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone size={10} className="text-gray-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.website && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Globe size={10} className="text-gray-400 shrink-0" />
                        <span className="truncate">{c.website}</span>
                      </div>
                    )}
                    {!c.city && !c.email && !c.phone && (
                      <p className="text-gray-400 text-center py-0.5">No contact info</p>
                    )}
                  </div>

                  {/* Signatory */}
                  {c.signatory_name && (
                    <div className="flex items-center gap-1.5 mb-3 px-0.5">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-[8px] font-bold">{c.signatory_name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-700 truncate">{c.signatory_name}</p>
                        <p className="text-[9px] text-gray-400 truncate">{c.signatory_designation}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-2.5 border-t border-gray-100">
                    <Link to={`/companies/${c.id}/edit`}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r ${grad} text-white hover:opacity-90 transition shadow-sm`}>
                      <Edit size={11} /> Edit
                    </Link>
                    <button onClick={() => setConfirm({ id: c.id })}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition">
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete Company?"
        message="This will deactivate the company. All employee and document records associated with it will be preserved."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={remove}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
