import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, FileText, FilePlus, Layers, TrendingUp, CreditCard, Sparkles, Award, LogOut, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const TYPE_LABELS = {
  offer_letter:           'Offer Letter',
  payslip:                'Payslip',
  experience_letter:      'Experience',
  relieving_letter:       'Relieving',
  salary_increment:       'Increment',
  internship_certificate: 'Internship',
};
const COLORS = ['#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#0d9488', '#7c3aed'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const cards = [
    { label: 'Companies',    value: stats.totalCompanies,  icon: Building2,  gradient: 'from-blue-500 to-blue-700' },
    { label: 'Employees',    value: stats.totalEmployees,  icon: Users,       gradient: 'from-emerald-500 to-green-700' },
    { label: 'Documents',    value: stats.totalDocuments,  icon: FileText,    gradient: 'from-violet-500 to-purple-700' }
  ];

  const quickDocs = [
    { type: 'offer_letter',      label: 'Offer Letter',      icon: Sparkles,   color: 'from-orange-400 to-amber-500' },
    { type: 'payslip',           label: 'Payslip',            icon: CreditCard, color: 'from-emerald-400 to-green-500' },
    { type: 'experience_letter', label: 'Experience Letter',  icon: Award,      color: 'from-violet-400 to-purple-500' },
    { type: 'relieving_letter',  label: 'Relieving Letter',   icon: LogOut,     color: 'from-rose-400 to-red-500' },
    { type: 'salary_increment',       label: 'Increment Letter',     icon: TrendingUp,    color: 'from-teal-400 to-teal-600' },
    { type: 'internship_certificate', label: 'Internship Cert',      icon: GraduationCap, color: 'from-violet-400 to-violet-600' },
  ];

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 via-indigo-700 to-violet-700 text-white px-6 py-6 mb-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-blue-200 text-sm mt-0.5">Welcome back — here's an overview of your activity</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map(({ label, value, icon: Icon, gradient }) => (
            <div key={label} className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className={`bg-gradient-to-r ${gradient} p-5 flex items-center justify-between`}>
                <div>
                  <p className="text-white/80 text-sm font-medium">{label}</p>
                  <p className="text-4xl font-bold text-white mt-1">{value}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl"><Icon size={28} className="text-white" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FilePlus size={18} className="text-blue-600" /> Quick Actions
          </h2>

          {/* Generate All — Full width */}
          <Link to="/generate-all"
            className="block bg-gradient-to-r from-brand-800 via-purple-700 to-pink-600 text-white p-4 rounded-xl mb-4 hover:opacity-95 transition shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl"><Layers size={22} /></div>
              <div>
                <div className="font-bold text-base">Generate All Documents at Once</div>
                <div className="text-blue-200 text-xs mt-0.5">
                  Fill once → Offer Letter + Payslip + Experience + Relieving + Increment Letter
                </div>
              </div>
            </div>
          </Link>

          {/* Individual doc buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickDocs.map(({ type, label, icon: Icon, color }) => (
              <Link key={type}
                to={type === 'internship_certificate' ? '/internship-certificate' : `/generate/${type}`}
                className={`bg-gradient-to-br ${color} text-white p-3.5 rounded-xl flex flex-col items-center gap-2 hover:opacity-90 hover:scale-105 transition shadow-sm text-center`}>
                <Icon size={20} />
                <span className="text-xs font-semibold leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Documents per Month (last 6)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.monthlyTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Documents by Type</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.documentsByType.map(d => ({
                    name: TYPE_LABELS[d.doc_type] || d.doc_type, value: d.count
                  }))}
                  dataKey="value" nameKey="name" outerRadius={80} label
                >
                  {stats.documentsByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={16} className="text-gray-500" /> Recent Documents</h2>
            <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Doc Number','Type','Employee','Company','Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentDocuments.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{d.doc_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                        ${d.doc_type === 'salary_increment' ? 'bg-teal-100 text-teal-700' :
                          d.doc_type === 'payslip' ? 'bg-emerald-100 text-emerald-700' :
                          d.doc_type === 'offer_letter' ? 'bg-blue-100 text-blue-700' :
                          d.doc_type === 'relieving_letter' ? 'bg-red-100 text-red-700' :
                          d.doc_type === 'internship_certificate' ? 'bg-violet-100 text-violet-700' :
                          'bg-amber-100 text-amber-700'}`}>
                        {TYPE_LABELS[d.doc_type] || d.doc_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(d.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                  </tr>
                ))}
                {stats.recentDocuments.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400">No documents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
