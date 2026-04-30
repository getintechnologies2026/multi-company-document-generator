import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, FileText, FilePlus, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const TYPE_LABELS = {
  offer_letter: 'Offer Letter',
  payslip: 'Payslip',
  experience_letter: 'Experience',
  relieving_letter: 'Relieving'
};
const COLORS = ['#1d4ed8', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) return <div className="text-gray-500">Loading dashboard...</div>;

  const cards = [
    { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'bg-blue-500' },
    { label: 'Employees', value: stats.totalEmployees, icon: Users, color: 'bg-green-500' },
    { label: 'Documents Generated', value: stats.totalDocuments, icon: FileText, color: 'bg-purple-500' }
  ];

  const quickActions = [
    { type: 'offer_letter', label: 'Offer Letter', color: 'bg-blue-600' },
    { type: 'payslip', label: 'Payslip', color: 'bg-green-600' },
    { type: 'experience_letter', label: 'Experience Letter', color: 'bg-amber-600' },
    { type: 'relieving_letter', label: 'Relieving Letter', color: 'bg-red-600' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back. Here's an overview of your activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`${color} text-white p-3 rounded-lg`}><Icon size={24} /></div>
            <div>
              <div className="text-sm text-gray-500">{label}</div>
              <div className="text-2xl font-bold">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Link to="/generate-all"
            className="bg-brand-800 text-white p-4 rounded-lg flex items-center gap-3 hover:opacity-90 transition col-span-1 md:col-span-2">
            <Layers size={22} />
            <div>
              <div className="font-bold">Generate All Documents at Once</div>
              <div className="text-xs text-blue-200">Fill once → get Offer Letter + Payslip + Experience + Relieving in one click</div>
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(({ type, label, color }) => (
            <Link
              key={type}
              to={`/generate/${type}`}
              className={`${color} text-white p-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition text-sm`}
            >
              <FilePlus size={16} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <div className="card">
          <h2 className="font-semibold mb-3">Documents per Month (last 6)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyTrend}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Type */}
        <div className="card">
          <h2 className="font-semibold mb-3">Documents by Type</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.documentsByType.map(d => ({ name: TYPE_LABELS[d.doc_type] || d.doc_type, value: d.count }))}
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
      <div className="card">
        <h2 className="font-semibold mb-3">Recent Documents</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Doc Number</th>
              <th className="table-th">Type</th>
              <th className="table-th">Employee</th>
              <th className="table-th">Company</th>
              <th className="table-th">Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentDocuments.map((d) => (
              <tr key={d.id}>
                <td className="table-td font-mono text-xs">{d.doc_number}</td>
                <td className="table-td">{TYPE_LABELS[d.doc_type]}</td>
                <td className="table-td">{d.employee_name}</td>
                <td className="table-td">{d.company_name}</td>
                <td className="table-td">{new Date(d.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentDocuments.length === 0 && (
              <tr><td colSpan="5" className="table-td text-center text-gray-400">No documents yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
