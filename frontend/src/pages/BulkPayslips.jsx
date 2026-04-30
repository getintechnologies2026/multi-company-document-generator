import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileDown, CheckCircle, AlertCircle, Loader, Download,
  CreditCard, Users, Calendar, Zap, Archive, Trash2, RefreshCw
} from 'lucide-react';
import api from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const QUICK_OPTIONS = [
  { id: 'last3',   label: 'Last 3 Months',   icon: '3️⃣', color: 'from-blue-400 to-blue-600',   months: 3  },
  { id: 'last6',   label: 'Last 6 Months',   icon: '6️⃣', color: 'from-violet-400 to-purple-600', months: 6  },
  { id: 'last12',  label: 'Last 12 Months',  icon: '📅', color: 'from-emerald-400 to-green-600', months: 12 },
  { id: 'curryear',label: 'Current Year',    icon: '🗓️', color: 'from-amber-400 to-orange-500',  months: 0, type: 'curryear' },
  { id: 'prevyear',label: 'Previous Year',   icon: '📆', color: 'from-rose-400 to-red-600',      months: 0, type: 'prevyear' },
  { id: 'finyear', label: 'Financial Year',  icon: '💰', color: 'from-teal-400 to-cyan-600',     months: 0, type: 'finyear' },
];

function buildMonthRows(type, count) {
  const now = new Date();
  let rows = [];

  if (type === 'last') {
    for (let i = count; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      rows.push({ pay_month: MONTHS[d.getMonth()], pay_year: d.getFullYear(), working_days: 30, paid_days: 30, lop_days: 0 });
    }
  } else if (type === 'curryear') {
    const y = now.getFullYear();
    for (let m = 0; m < now.getMonth(); m++)
      rows.push({ pay_month: MONTHS[m], pay_year: y, working_days: 30, paid_days: 30, lop_days: 0 });
  } else if (type === 'prevyear') {
    const y = now.getFullYear() - 1;
    for (let m = 0; m < 12; m++)
      rows.push({ pay_month: MONTHS[m], pay_year: y, working_days: 30, paid_days: 30, lop_days: 0 });
  } else if (type === 'finyear') {
    // Indian FY: Apr prev to Mar current
    const startY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < 12; i++) {
      const d = new Date(startY, 3 + i, 1);
      if (d > now) break;
      rows.push({ pay_month: MONTHS[d.getMonth()], pay_year: d.getFullYear(), working_days: 30, paid_days: 30, lop_days: 0 });
    }
  }
  return rows;
}

function StatusBadge({ status }) {
  if (status === 'pending')   return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Pending</span>;
  if (status === 'loading')   return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-600 flex items-center gap-1"><Loader size={10} className="animate-spin" />Generating</span>;
  if (status === 'done')      return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10} />Done</span>;
  if (status === 'error')     return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 flex items-center gap-1"><AlertCircle size={10} />Error</span>;
  return null;
}

export default function BulkPayslips() {
  const [companies, setCompanies]   = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [companyId, setCompanyId]   = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [empData, setEmpData]       = useState({});
  const [salary, setSalary]         = useState({ basic:0, hra:0, da:0, conveyance:0, medical:0, special_allowance:0, pf:0, esi:0, professional_tax:0, tds:0 });
  const [monthRows, setMonthRows]   = useState([]);
  const [customFrom, setCustomFrom] = useState({ month: 0, year: new Date().getFullYear() });
  const [customTo, setCustomTo]     = useState({ month: new Date().getMonth() - 1, year: new Date().getFullYear() });
  const [generating, setGenerating] = useState(false);
  const [results, setResults]       = useState(null);
  const [activeQuick, setActiveQuick] = useState('');

  // Auto calc earnings
  const gross = ['basic','hra','da','conveyance','medical','special_allowance'].reduce((s,k) => s + Number(salary[k]||0), 0);
  const ded   = ['pf','esi','professional_tax','tds'].reduce((s,k) => s + Number(salary[k]||0), 0);
  const net   = gross - ded;

  useEffect(() => { api.get('/companies').then(({ data }) => setCompanies(data)); }, []);

  useEffect(() => {
    if (!companyId) { setEmployees([]); return; }
    api.get('/employees', { params: { company_id: companyId } }).then(({ data }) => setEmployees(data));
    setEmployeeId('');
  }, [companyId]);

  useEffect(() => {
    if (!employeeId) return;
    const e = employees.find(x => x.id == employeeId);
    if (!e) return;
    setEmpData(e);
    setSalary({
      basic: e.basic||0, hra: e.hra||0, da: e.da||0, conveyance: e.conveyance||0,
      medical: e.medical||0, special_allowance: e.special_allowance||0,
      pf: e.pf||0, esi: e.esi||0, professional_tax: e.professional_tax||0, tds: e.tds||0
    });
    toast.success('Salary auto-filled from employee record!');
  }, [employeeId]);

  const applyQuick = (opt) => {
    setActiveQuick(opt.id);
    let rows = [];
    if (opt.type) rows = buildMonthRows(opt.type, 0);
    else rows = buildMonthRows('last', opt.months);
    setMonthRows(rows.map(r => ({
      ...r,
      gross_earnings: gross.toFixed(2),
      total_deductions: ded.toFixed(2),
      net_pay: net.toFixed(2),
      amount_in_words: ''
    })));
    setResults(null);
    toast(`${rows.length} month(s) loaded`, { icon: '📅' });
  };

  const applyCustom = () => {
    const rows = [];
    let y = customFrom.year, m = customFrom.month;
    while (y < customTo.year || (y === customTo.year && m <= customTo.month)) {
      rows.push({ pay_month: MONTHS[m], pay_year: y, working_days: 30, paid_days: 30, lop_days: 0,
        gross_earnings: gross.toFixed(2), total_deductions: ded.toFixed(2), net_pay: net.toFixed(2), amount_in_words: '' });
      m++;
      if (m > 11) { m = 0; y++; }
      if (rows.length > 60) break;
    }
    setMonthRows(rows);
    setActiveQuick('custom');
    setResults(null);
    toast(`${rows.length} month(s) loaded`, { icon: '📅' });
  };

  const updateRow = (idx, field, val) => {
    setMonthRows(rows => rows.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r, [field]: val };
      if (['working_days','paid_days','lop_days'].includes(field)) return updated;
      return updated;
    }));
  };

  const removeRow = (idx) => setMonthRows(rows => rows.filter((_, i) => i !== idx));

  // Sync salary changes into all rows
  useEffect(() => {
    if (!monthRows.length) return;
    setMonthRows(rows => rows.map(r => ({
      ...r,
      gross_earnings: gross.toFixed(2),
      total_deductions: ded.toFixed(2),
      net_pay: net.toFixed(2)
    })));
  }, [gross, ded, net]);

  const generate = async () => {
    if (!companyId) return toast.error('Select a company');
    if (!monthRows.length) return toast.error('Add months first');
    if (!empData.full_name && !employeeId) return toast.error('Select an employee');
    setGenerating(true); setResults(null);
    try {
      const { data } = await api.post('/documents/generate-payslips-bulk', {
        company_id: companyId,
        employee_id: employeeId || null,
        employee: { ...empData, ...salary },
        months: monthRows
      });
      setResults(data);
      toast.success(`${data.generated} payslips generated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setGenerating(false);
    }
  };

  const inr = (n) => Number(n||0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #eff6ff 50%, #fdf4ff 100%)' }}>
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white px-6 py-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard size={24} /> Bulk Payslip Generator</h1>
            <p className="text-green-100 text-sm mt-1">Generate payslips for 3 months, 6 months, 1 year or custom range — single click</p>
          </div>
          <button onClick={generate} disabled={generating || !monthRows.length}
            className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-green-50 px-6 py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50">
            {generating ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
            {generating ? 'Generating...' : `Generate ${monthRows.length || ''} Payslips`}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-5">
        {/* Results Banner */}
        {results && (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <CheckCircle size={18} /> {results.generated}/{results.total} Payslips Generated
              </span>
              {results.zipUrl && (
                <a href={results.zipUrl} download
                  className="flex items-center gap-2 bg-white text-emerald-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-50 transition">
                  <Archive size={15} /> Download All as ZIP
                </a>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-th">Month</th>
                    <th className="table-th">Doc Number</th>
                    <th className="table-th">Net Pay</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i} className={r.success ? '' : 'bg-red-50'}>
                      <td className="table-td font-medium">{r.pay_month} {r.pay_year}</td>
                      <td className="table-td font-mono text-xs">{r.doc_number || '—'}</td>
                      <td className="table-td font-bold text-emerald-700">₹{inr(r.net_pay)}</td>
                      <td className="table-td"><StatusBadge status={r.success ? 'done' : 'error'} /></td>
                      <td className="table-td">
                        {r.success && (
                          <div className="flex gap-2">
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700">View</a>
                            <a href={r.url} download className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 flex items-center gap-1"><Download size={11}/>Save</a>
                          </div>
                        )}
                        {!r.success && <span className="text-xs text-red-500">{r.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT — Setup */}
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1 — Company & Employee */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-700 px-5 py-3 flex items-center gap-3">
                <Users size={18} className="text-white" />
                <div>
                  <div className="text-white font-bold">Step 1 — Select Company & Employee</div>
                  <div className="text-purple-200 text-xs">Salary will auto-fill from employee record</div>
                </div>
              </div>
              <div className="p-5 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">Company *</label>
                  <select className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={companyId} onChange={e => setCompanyId(e.target.value)}>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-700 uppercase tracking-wide mb-1.5">Employee *</label>
                  <select className="w-full px-3 py-2.5 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={!companyId}>
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.emp_code}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2 — Salary */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-700 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard size={18} className="text-white" />
                  <div>
                    <div className="text-white font-bold">Step 2 — Salary Structure</div>
                    <div className="text-green-200 text-xs">Same salary applies to all selected months</div>
                  </div>
                </div>
                <div className="bg-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-bold">
                  Net: ₹{inr(net)}
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="col-span-2 md:col-span-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1 bg-emerald-100"></div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Earnings</span>
                      <div className="h-px flex-1 bg-emerald-100"></div>
                    </div>
                  </div>
                  {[['basic','Basic'],['hra','HRA'],['da','DA'],['conveyance','Conveyance'],['medical','Medical'],['special_allowance','Special Allowance']].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-emerald-700 mb-1">{l}</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-emerald-400 text-xs font-bold">₹</span>
                        <input type="number" value={salary[k]} onChange={e => setSalary(s => ({...s,[k]:e.target.value}))}
                          className="w-full pl-5 pr-2 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="0" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2 md:col-span-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px flex-1 bg-red-100"></div>
                      <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Deductions</span>
                      <div className="h-px flex-1 bg-red-100"></div>
                    </div>
                  </div>
                  {[['pf','PF'],['esi','ESI'],['professional_tax','Prof. Tax'],['tds','TDS']].map(([k,l]) => (
                    <div key={k}>
                      <label className="block text-xs font-semibold text-red-500 mb-1">{l}</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-red-300 text-xs font-bold">₹</span>
                        <input type="number" value={salary[k]} onChange={e => setSalary(s => ({...s,[k]:e.target.value}))}
                          className="w-full pl-5 pr-2 py-2 border border-red-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="0" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-green-500 text-white rounded-xl p-3 text-center">
                    <div className="text-xs opacity-80">Gross</div>
                    <div className="font-bold text-sm">₹{inr(gross)}</div>
                  </div>
                  <div className="bg-red-500 text-white rounded-xl p-3 text-center">
                    <div className="text-xs opacity-80">Deductions</div>
                    <div className="font-bold text-sm">₹{inr(ded)}</div>
                  </div>
                  <div className="bg-blue-600 text-white rounded-xl p-3 text-center">
                    <div className="text-xs opacity-80">Net Pay</div>
                    <div className="font-bold text-sm">₹{inr(net)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 — Select Months */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 flex items-center gap-3">
                <Calendar size={18} className="text-white" />
                <div>
                  <div className="text-white font-bold">Step 3 — Select Month Range</div>
                  <div className="text-amber-100 text-xs">Pick a quick range or set custom from–to dates</div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* Quick Select */}
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Quick Select</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {QUICK_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => applyQuick(opt)}
                        className={`bg-gradient-to-r ${opt.color} text-white rounded-xl p-3 text-left hover:opacity-90 transition shadow ${activeQuick === opt.id ? 'ring-2 ring-offset-2 ring-amber-400' : ''}`}>
                        <div className="text-xl mb-1">{opt.icon}</div>
                        <div className="font-bold text-sm">{opt.label}</div>
                        {opt.months > 0 && <div className="text-xs opacity-80">{opt.months} payslips</div>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Range */}
                <div className="border-t border-amber-100 pt-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Custom Range</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">From Month</label>
                      <select className="w-full px-2 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={customFrom.month} onChange={e => setCustomFrom(f => ({...f, month: Number(e.target.value)}))}>
                        {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">From Year</label>
                      <input type="number" value={customFrom.year} onChange={e => setCustomFrom(f => ({...f, year: Number(e.target.value)}))}
                        className="w-full px-2 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">To Month</label>
                      <select className="w-full px-2 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={customTo.month} onChange={e => setCustomTo(f => ({...f, month: Number(e.target.value)}))}>
                        {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">To Year</label>
                      <input type="number" value={customTo.year} onChange={e => setCustomTo(f => ({...f, year: Number(e.target.value)}))}
                        className="w-full px-2 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <button onClick={applyCustom}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition">
                      <RefreshCw size={14} /> Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 — Month-wise Table */}
            {monthRows.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-700 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileDown size={18} className="text-white" />
                    <div>
                      <div className="text-white font-bold">Step 4 — Review & Edit Months</div>
                      <div className="text-blue-200 text-xs">{monthRows.length} months selected — adjust days per month if needed</div>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{monthRows.length} months</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="table-th">#</th>
                        <th className="table-th">Month & Year</th>
                        <th className="table-th">Working Days</th>
                        <th className="table-th">Paid Days</th>
                        <th className="table-th">LOP</th>
                        <th className="table-th text-green-700">Net Pay</th>
                        <th className="table-th"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthRows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                          <td className="table-td text-gray-400 text-xs">{idx + 1}</td>
                          <td className="table-td font-semibold text-blue-700">{row.pay_month} {row.pay_year}</td>
                          <td className="table-td">
                            <input type="number" value={row.working_days} onChange={e => updateRow(idx, 'working_days', e.target.value)}
                              className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </td>
                          <td className="table-td">
                            <input type="number" value={row.paid_days} onChange={e => updateRow(idx, 'paid_days', e.target.value)}
                              className="w-16 px-2 py-1 border border-blue-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          </td>
                          <td className="table-td">
                            <input type="number" value={row.lop_days} onChange={e => updateRow(idx, 'lop_days', e.target.value)}
                              className="w-14 px-2 py-1 border border-red-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-red-300" />
                          </td>
                          <td className="table-td font-bold text-emerald-700">₹{inr(row.net_pay)}</td>
                          <td className="table-td">
                            <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <td colSpan="5" className="px-4 py-2 text-xs font-bold uppercase">Total Net Pay ({monthRows.length} months)</td>
                        <td className="px-4 py-2 font-bold">₹{inr(monthRows.reduce((s,r) => s + Number(r.net_pay||0), 0))}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Final Generate Button */}
            {monthRows.length > 0 && (
              <button onClick={generate} disabled={generating}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg shadow-xl transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #059669, #0891b2, #4f46e5)', color: 'white' }}>
                {generating ? <Loader size={22} className="animate-spin" /> : <Zap size={22} />}
                {generating ? `Generating ${monthRows.length} Payslips...` : `Generate All ${monthRows.length} Payslips at Once`}
              </button>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-4 py-3">
                <h3 className="text-white font-bold text-sm">Generation Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs text-gray-500">Employee</span>
                  <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">{empData.full_name || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs text-gray-500">Months Selected</span>
                  <span className="text-sm font-bold text-teal-700">{monthRows.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs text-gray-500">Monthly Net Pay</span>
                  <span className="text-sm font-bold text-blue-700">₹{inr(net)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-500">Total Payout</span>
                  <span className="text-sm font-bold text-emerald-700">₹{inr(monthRows.reduce((s,r) => s + Number(r.net_pay||0), 0))}</span>
                </div>
              </div>
            </div>

            {/* Month list preview */}
            {monthRows.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
                  <h3 className="text-white font-bold text-sm">Months ({monthRows.length})</h3>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto space-y-1.5">
                  {monthRows.map((r, i) => {
                    const res = results?.results?.[i];
                    return (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-xs font-medium text-gray-700">{r.pay_month} {r.pay_year}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-bold">₹{inr(r.net_pay)}</span>
                          {res && <StatusBadge status={res.success ? 'done' : 'error'} />}
                          {!res && generating && <StatusBadge status="loading" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ZIP download if available */}
            {results?.zipUrl && (
              <a href={results.zipUrl} download
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:opacity-90 transition">
                <Archive size={18} /> Download All as ZIP
              </a>
            )}

            {/* Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2">How it works</p>
              <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Select company & employee</li>
                <li>Verify/edit salary structure</li>
                <li>Pick a quick range or custom dates</li>
                <li>Adjust per-month days if needed</li>
                <li>Click Generate — get all PDFs + ZIP</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
