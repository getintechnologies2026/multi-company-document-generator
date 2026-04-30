import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileDown, CheckCircle, AlertCircle, Loader,
  User, Building2, CreditCard, FileText, Award, LogOut,
  ChevronDown, ChevronUp, Sparkles, Download, TrendingUp,
  Percent, DollarSign, ArrowUpCircle, RefreshCw,
  Calendar, Zap, Archive, Trash2
} from 'lucide-react';
import api from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DOC_META = {
  offer_letter:      { label: 'Offer Letter',      icon: FileText,    color: '#3b82f6' },
  payslip:           { label: 'Payslip',            icon: CreditCard,  color: '#10b981' },
  experience_letter: { label: 'Experience Letter',  icon: Award,       color: '#f59e0b' },
  relieving_letter:  { label: 'Relieving Letter',   icon: LogOut,      color: '#ef4444' },
  salary_increment:  { label: 'Increment Letter',   icon: TrendingUp,  color: '#0d9488' },
};

const inrFmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const inr2   = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

const PAYSLIP_QUICK = [
  { id: 'last3',    label: '3 Months',      icon: '3️⃣', months: 3,  type: 'last',     color: 'from-blue-400 to-blue-600' },
  { id: 'last6',    label: '6 Months',      icon: '6️⃣', months: 6,  type: 'last',     color: 'from-violet-400 to-purple-600' },
  { id: 'last12',   label: '1 Year',        icon: '📅', months: 12, type: 'last',     color: 'from-emerald-400 to-green-600' },
  { id: 'curryear', label: 'Current Year',  icon: '🗓️', months: 0,  type: 'curryear', color: 'from-amber-400 to-orange-500' },
  { id: 'prevyear', label: 'Prev Year',     icon: '📆', months: 0,  type: 'prevyear', color: 'from-rose-400 to-red-600' },
  { id: 'finyear',  label: 'Financial Year',icon: '💰', months: 0,  type: 'finyear',  color: 'from-teal-400 to-cyan-600' },
  { id: 'tenure',   label: 'Full Tenure',   icon: '🏆', months: 0,  type: 'tenure',   color: 'from-indigo-400 to-indigo-700' },
];

function buildPayslipRows(type, count, joinDate) {
  const now = new Date();
  const rows = [];
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
    const startY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    for (let i = 0; i < 12; i++) {
      const d = new Date(startY, 3 + i, 1);
      if (d > now) break;
      rows.push({ pay_month: MONTHS[d.getMonth()], pay_year: d.getFullYear(), working_days: 30, paid_days: 30, lop_days: 0 });
    }
  } else if (type === 'tenure' && joinDate) {
    let start = new Date(joinDate);
    start = new Date(start.getFullYear(), start.getMonth(), 1);
    while (start < now && rows.length < 120) {
      rows.push({ pay_month: MONTHS[start.getMonth()], pay_year: start.getFullYear(), working_days: 30, paid_days: 30, lop_days: 0 });
      start.setMonth(start.getMonth() + 1);
    }
  }
  return rows;
}

const SECTIONS = [
  {
    id: 'company',
    label: 'Company & Employee',
    icon: Building2,
    gradient: 'from-violet-600 to-purple-700',
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    ring: 'focus:ring-violet-400',
    desc: 'Select the company and employee'
  },
  {
    id: 'employee',
    label: 'Employee Details',
    icon: User,
    gradient: 'from-blue-500 to-blue-700',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'focus:ring-blue-400',
    desc: 'Personal, job & bank information'
  },
  {
    id: 'salary',
    label: 'Salary Structure',
    icon: CreditCard,
    gradient: 'from-emerald-500 to-green-700',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'focus:ring-emerald-400',
    desc: 'Earnings and deductions breakdown'
  },
  {
    id: 'payslip',
    label: 'Payslip Details',
    icon: FileText,
    gradient: 'from-cyan-500 to-teal-600',
    light: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-700',
    ring: 'focus:ring-cyan-400',
    desc: 'Month, year and attendance details'
  },
  {
    id: 'offer',
    label: 'Offer Letter',
    icon: Sparkles,
    gradient: 'from-orange-500 to-amber-600',
    light: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    ring: 'focus:ring-orange-400',
    desc: 'Designation, CTC and joining date'
  },
  {
    id: 'other',
    label: 'Experience & Relieving',
    icon: Award,
    gradient: 'from-rose-500 to-pink-700',
    light: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-700',
    ring: 'focus:ring-rose-400',
    desc: 'Last working day and experience summary'
  }
];

function Field({ label, children, color = 'text-gray-600' }) {
  return (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${color}`}>{label}</label>
      {children}
    </div>
  );
}

function SInput({ ring, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition ${props.className || ''}`}
    />
  );
}

function SSelect({ ring, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition`}
    >
      {children}
    </select>
  );
}

export default function GenerateAll() {
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [open, setOpen] = useState({ company: true, employee: true, salary: true, payslip: true, offer: true, other: true, increment: true });
  const [generating, setGenerating] = useState(false);
  const [generatingInc, setGeneratingInc] = useState(false);
  const [results, setResults] = useState(null);
  const [incResult, setIncResult] = useState(null);

  const [emp, setEmp] = useState({
    full_name:'', designation:'', department:'', emp_code:'', pan:'', uan:'', pf_no:'',
    date_of_joining:'', date_of_leaving:'', employment_type:'Full-Time',
    bank_name:'', bank_account:'', ifsc_code:''
  });
  const [salary, setSalary] = useState({
    ctc:'', basic:'', hra:'', da:'', conveyance:'', medical:'', special_allowance:'',
    pf:'', esi:'', professional_tax:'', tds:''
  });
  const [payslip, setPayslip] = useState({
    pay_month:'', pay_year: new Date().getFullYear(), working_days:30, paid_days:30, lop_days:0,
    gross_earnings:'', total_deductions:'', net_pay:'', amount_in_words:''
  });
  const [offer, setOffer]       = useState({ joining_date:'', designation:'', ctc:'' });
  const [experience, setExp]    = useState({ summary:'' });
  const [relieving, setRelieving] = useState({ relieving_date:'' });
  const [increment, setIncrement] = useState({
    increment_date: '', increment_type: 'percentage', increment_value: ''
  });

  // ── Bulk Payslip state ──
  const [psMonthRows, setPsMonthRows]           = useState([]);
  const [psResults, setPsResults]               = useState(null);
  const [generatingPs, setGeneratingPs]         = useState(false);
  const [activePsQuick, setActivePsQuick]       = useState('');
  const [psCustomFrom, setPsCustomFrom]         = useState({ month: 0, year: new Date().getFullYear() });
  const [psCustomTo, setPsCustomTo]             = useState({
    month: new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1,
    year:  new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
  });

  // ── Salary computed totals — declared early so useEffects below can use them ──
  const salaryGross = ['basic','hra','da','conveyance','medical','special_allowance']
    .reduce((s, k) => s + Number(salary[k] || 0), 0);
  const salaryDed = ['pf','esi','professional_tax','tds']
    .reduce((s, k) => s + Number(salary[k] || 0), 0);
  const salaryNet = salaryGross - salaryDed;

  useEffect(() => {
    setPayslip(p => ({
      ...p,
      gross_earnings: salaryGross.toFixed(2),
      total_deductions: salaryDed.toFixed(2),
      net_pay: salaryNet.toFixed(2)
    }));
  }, [salaryGross, salaryDed, salaryNet]);  // eslint-disable-line

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
    const fmt = d => d ? d.split('T')[0] : '';
    setEmp({
      full_name: e.full_name||'', designation: e.designation||'', department: e.department||'',
      emp_code: e.emp_code||'', pan: e.pan||'', uan: e.uan||'', pf_no: e.pf_no||'',
      date_of_joining: fmt(e.date_of_joining), date_of_leaving: fmt(e.date_of_leaving),
      employment_type: e.employment_type||'Full-Time',
      bank_name: e.bank_name||'', bank_account: e.bank_account||'', ifsc_code: e.ifsc_code||''
    });
    setSalary({
      ctc: e.ctc||'', basic: e.basic||'', hra: e.hra||'', da: e.da||'',
      conveyance: e.conveyance||'', medical: e.medical||'', special_allowance: e.special_allowance||'',
      pf: e.pf||'', esi: e.esi||'', professional_tax: e.professional_tax||'', tds: e.tds||''
    });
    setOffer(o => ({ ...o, joining_date: fmt(e.date_of_joining), designation: e.designation||'', ctc: e.ctc||'' }));
    setRelieving(r => ({ ...r, relieving_date: fmt(e.date_of_leaving) }));
    toast.success('Employee details auto-filled!');
  }, [employeeId]);

  const ch = setter => e => setter(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggle = id => setOpen(o => ({ ...o, [id]: !o[id] }));

  // ── Increment preview calculation ──
  const curCtc  = Number(salary.ctc || 0);
  const incVal  = Number(increment.increment_value || 0);
  const newCtc  = increment.increment_type === 'percentage'
    ? Math.round(curCtc * (1 + incVal / 100))
    : curCtc + Math.round(incVal * 12);
  const incAmt  = newCtc - curCtc;
  const newMonthly = Math.round(newCtc / 12);
  const curMonthly = Math.round(curCtc / 12);

  const generateIncrement = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name is required');
    if (!increment.increment_value) return toast.error('Enter increment value');
    if (!increment.increment_date) return toast.error('Select increment effective date');
    setGeneratingInc(true); setIncResult(null);
    try {
      const { data } = await api.post('/documents/generate-salary-increment', {
        company_id: companyId, employee_id: employeeId || null,
        employee: { ...emp, ...salary },
        increment
      });
      setIncResult(data);
      toast.success('Salary Increment Letter generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGeneratingInc(false);
    }
  };

  // ── Payslip rows salary sync ──
  useEffect(() => {
    if (!psMonthRows.length) return;
    setPsMonthRows(rows => rows.map(r => ({
      ...r,
      gross_earnings: salaryGross.toFixed(2),
      total_deductions: salaryDed.toFixed(2),
      net_pay: salaryNet.toFixed(2)
    })));
  }, [salaryGross, salaryDed, salaryNet]);  // eslint-disable-line

  // ── Auto-update payslip state for "Generate All" from last bulk row ──
  useEffect(() => {
    if (!psMonthRows.length) return;
    const last = psMonthRows[psMonthRows.length - 1];
    setPayslip(p => ({
      ...p,
      pay_month: last.pay_month,
      pay_year: last.pay_year,
      working_days: last.working_days,
      paid_days: last.paid_days,
      lop_days: last.lop_days,
      gross_earnings: last.gross_earnings,
      total_deductions: last.total_deductions,
      net_pay: last.net_pay,
    }));
  }, [psMonthRows]);

  const applyPsQuick = (opt) => {
    setActivePsQuick(opt.id);
    const rows = buildPayslipRows(opt.type, opt.months, emp.date_of_joining);
    if (!rows.length) {
      toast.error(opt.type === 'tenure' && !emp.date_of_joining
        ? 'Fill Date of Joining in Employee Details first'
        : 'No months found for this selection');
      return;
    }
    setPsMonthRows(rows.map(r => ({
      ...r,
      gross_earnings: salaryGross.toFixed(2),
      total_deductions: salaryDed.toFixed(2),
      net_pay: salaryNet.toFixed(2),
      amount_in_words: ''
    })));
    setPsResults(null);
    toast(`${rows.length} month${rows.length > 1 ? 's' : ''} loaded`, { icon: '📅' });
  };

  const applyPsCustom = () => {
    const rows = [];
    let y = psCustomFrom.year, m = psCustomFrom.month;
    while (y < psCustomTo.year || (y === psCustomTo.year && m <= psCustomTo.month)) {
      rows.push({
        pay_month: MONTHS[m], pay_year: y, working_days: 30, paid_days: 30, lop_days: 0,
        gross_earnings: salaryGross.toFixed(2),
        total_deductions: salaryDed.toFixed(2),
        net_pay: salaryNet.toFixed(2),
        amount_in_words: ''
      });
      m++;
      if (m > 11) { m = 0; y++; }
      if (rows.length > 60) break;
    }
    if (!rows.length) return toast.error('Invalid date range');
    setPsMonthRows(rows);
    setActivePsQuick('custom');
    setPsResults(null);
    toast(`${rows.length} month${rows.length > 1 ? 's' : ''} loaded`, { icon: '📅' });
  };

  const updatePsRow = (idx, field, val) => {
    setPsMonthRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const generatePayslips = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name is required');
    if (!psMonthRows.length) return toast.error('Select a month range first');
    setGeneratingPs(true); setPsResults(null);
    try {
      const { data } = await api.post('/documents/generate-payslips-bulk', {
        company_id: companyId,
        employee_id: employeeId || null,
        employee: { ...emp, ...salary },
        months: psMonthRows
      });
      setPsResults(data);
      toast.success(`${data.generated} payslip${data.generated > 1 ? 's' : ''} generated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payslip generation failed');
    } finally {
      setGeneratingPs(false);
    }
  };

  const generateAll = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name is required');
    setGenerating(true); setResults(null);
    try {
      const { data } = await api.post('/documents/generate-all', {
        company_id: companyId, employee_id: employeeId || null,
        employee: { ...emp, ...salary }, payslip, offer, experience, relieving,
        increment: (increment.increment_value && increment.increment_date) ? increment : null
      });
      setResults(data.documents);
      const incGenerated = data.documents?.salary_increment && !data.documents.salary_increment.error;
      toast.success(incGenerated ? 'All 5 documents generated!' : 'All 4 documents generated!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const SectionHeader = ({ sec }) => (
    <button type="button" onClick={() => toggle(sec.id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${sec.gradient} text-white shadow-md`}>
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg"><sec.icon size={18} /></div>
        <div className="text-left">
          <div className="font-bold text-base">{sec.label}</div>
          <div className="text-xs text-white/80">{sec.desc}</div>
        </div>
      </div>
      {open[sec.id] ? <ChevronUp size={20} className="text-white/80" /> : <ChevronDown size={20} className="text-white/80" />}
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #fff0f5 100%)' }}>
      {/* Page Header */}
      <div className="bg-gradient-to-r from-brand-800 via-purple-700 to-pink-600 text-white px-6 py-6 mb-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles size={24} /> Generate All Documents
            </h1>
            <p className="text-blue-100 text-sm mt-1">Fill once → Offer Letter + Payslip + Experience + Relieving + Increment Letter</p>
          </div>
          <button onClick={generateAll} disabled={generating}
            className="flex items-center gap-2 bg-white text-brand-800 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-60 text-sm">
            {generating ? <Loader size={18} className="animate-spin text-brand-700" /> : <FileDown size={18} />}
            {generating ? 'Generating...' : 'Generate All 5 Documents'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        {/* Results Bar */}
        {results && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 flex items-center gap-2">
              <CheckCircle size={20} className="text-white" />
              <span className="font-bold text-white">Documents Generated Successfully!</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-0 divide-x divide-y md:divide-y-0">
              {Object.entries(DOC_META).map(([key, { label, icon: Icon, color }]) => {
                const r = results[key];
                const isOptional = key === 'salary_increment';
                return (
                  <div key={key} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={16} style={{ color }} />
                      <span className="text-xs font-semibold text-gray-700">{label}</span>
                    </div>
                    {r && !r.error ? (
                      <div className="space-y-1.5">
                        <div className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1 truncate">{r.doc_number}</div>
                        <div className="flex gap-1">
                          <a href={r.url} target="_blank" rel="noreferrer"
                            style={{ background: color }}
                            className="flex-1 text-center text-xs text-white py-1.5 rounded-lg font-medium hover:opacity-90 transition">
                            View
                          </a>
                          <a href={r.url} download
                            className="flex-1 text-center text-xs bg-gray-100 text-gray-700 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-1">
                            <Download size={11} /> Save
                          </a>
                        </div>
                      </div>
                    ) : r?.error ? (
                      <div className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {r.error}
                      </div>
                    ) : isOptional ? (
                      <div className="text-xs text-gray-400 italic">Not included — fill Section 7</div>
                    ) : (
                      <div className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> Failed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* FORM COLUMN */}
          <div className="lg:col-span-2 space-y-4">

            {/* SECTION 1 – Company & Employee */}
            {(() => { const sec = SECTIONS[0]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Company" color={sec.text}>
                        <SSelect ring={sec.ring} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                          <option value="">Select Company</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </SSelect>
                      </Field>
                      <Field label="Employee (auto-fills form)" color={sec.text}>
                        <SSelect ring={sec.ring} value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={!companyId}>
                          <option value="">Select or fill manually below</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.emp_code}</option>)}
                        </SSelect>
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 2 – Employee Details */}
            {(() => { const sec = SECTIONS[1]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Field label="Full Name *" color={sec.text}>
                        <SInput ring={sec.ring} name="full_name" value={emp.full_name} onChange={ch(setEmp)} placeholder="Rajesh Kumar" />
                      </Field>
                      <Field label="Employee Code" color={sec.text}>
                        <SInput ring={sec.ring} name="emp_code" value={emp.emp_code} onChange={ch(setEmp)} placeholder="EMP001" />
                      </Field>
                      <Field label="Designation" color={sec.text}>
                        <SInput ring={sec.ring} name="designation" value={emp.designation} onChange={ch(setEmp)} placeholder="Software Engineer" />
                      </Field>
                      <Field label="Department" color={sec.text}>
                        <SInput ring={sec.ring} name="department" value={emp.department} onChange={ch(setEmp)} placeholder="Technology" />
                      </Field>
                      <Field label="Date of Joining" color={sec.text}>
                        <SInput ring={sec.ring} type="date" name="date_of_joining" value={emp.date_of_joining} onChange={ch(setEmp)} />
                      </Field>
                      <Field label="Date of Leaving" color={sec.text}>
                        <SInput ring={sec.ring} type="date" name="date_of_leaving" value={emp.date_of_leaving} onChange={ch(setEmp)} />
                      </Field>
                      <Field label="Employment Type" color={sec.text}>
                        <SSelect ring={sec.ring} name="employment_type" value={emp.employment_type} onChange={ch(setEmp)}>
                          <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Intern</option>
                        </SSelect>
                      </Field>
                      <Field label="PAN Number" color={sec.text}>
                        <SInput ring={sec.ring} name="pan" value={emp.pan} onChange={ch(setEmp)} placeholder="ABCDE1234F" />
                      </Field>
                      <Field label="UAN" color={sec.text}>
                        <SInput ring={sec.ring} name="uan" value={emp.uan} onChange={ch(setEmp)} placeholder="100XXXXXXXXX" />
                      </Field>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${sec.text}`}>Bank Details</p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Field label="Bank Name" color={sec.text}>
                          <SInput ring={sec.ring} name="bank_name" value={emp.bank_name} onChange={ch(setEmp)} placeholder="HDFC Bank" />
                        </Field>
                        <Field label="Account Number" color={sec.text}>
                          <SInput ring={sec.ring} name="bank_account" value={emp.bank_account} onChange={ch(setEmp)} />
                        </Field>
                        <Field label="IFSC Code" color={sec.text}>
                          <SInput ring={sec.ring} name="ifsc_code" value={emp.ifsc_code} onChange={ch(setEmp)} placeholder="HDFC0001234" />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 3 – Salary */}
            {(() => { const sec = SECTIONS[2]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-0.5 flex-1 bg-emerald-200"></div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest px-2">Earnings</span>
                        <div className="h-0.5 flex-1 bg-emerald-200"></div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-3">
                        {[['ctc','Annual CTC'],['basic','Basic'],['hra','HRA'],['da','DA'],['conveyance','Conveyance'],['medical','Medical'],['special_allowance','Special Allowance']].map(([name, label]) => (
                          <Field key={name} label={label} color={sec.text}>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-emerald-400 font-bold text-sm">₹</span>
                              <SInput ring={sec.ring} type="number" name={name} value={salary[name]} onChange={ch(setSalary)} className="pl-7" placeholder="0" />
                            </div>
                          </Field>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-0.5 flex-1 bg-red-200"></div>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest px-2">Deductions</span>
                        <div className="h-0.5 flex-1 bg-red-200"></div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-3">
                        {[['pf','PF'],['esi','ESI'],['professional_tax','Prof. Tax'],['tds','TDS']].map(([name, label]) => (
                          <Field key={name} label={label} color="text-red-500">
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-red-300 font-bold text-sm">₹</span>
                              <SInput ring="focus:ring-red-300" type="number" name={name} value={salary[name]} onChange={ch(setSalary)} className="pl-7 border-red-100" placeholder="0" />
                            </div>
                          </Field>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 4 – Payslip with Bulk Options */}
            {(() => { const sec = SECTIONS[3]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl space-y-5`}>

                    {/* ── Quick Select ── */}
                    <div>
                      <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar size={13} /> Quick Select Range
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                        {PAYSLIP_QUICK.map(opt => (
                          <button key={opt.id} type="button" onClick={() => applyPsQuick(opt)}
                            className={`py-2.5 px-1 rounded-xl text-xs font-bold border-2 text-center transition
                              ${activePsQuick === opt.id
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                                : 'bg-white text-cyan-700 border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50'}`}>
                            <div className="text-base mb-0.5">{opt.icon}</div>
                            <div className="leading-tight">{opt.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Custom Range ── */}
                    <div className="border-t border-cyan-200 pt-4">
                      <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-3">Custom Range</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">From Month</label>
                          <select value={psCustomFrom.month} onChange={e => setPsCustomFrom(f => ({...f, month: Number(e.target.value)}))}
                            className="w-full px-2 py-2 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">From Year</label>
                          <input type="number" value={psCustomFrom.year}
                            onChange={e => setPsCustomFrom(f => ({...f, year: Number(e.target.value)}))}
                            className="w-full px-2 py-2 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">To Month</label>
                          <select value={psCustomTo.month} onChange={e => setPsCustomTo(f => ({...f, month: Number(e.target.value)}))}
                            className="w-full px-2 py-2 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">To Year</label>
                          <input type="number" value={psCustomTo.year}
                            onChange={e => setPsCustomTo(f => ({...f, year: Number(e.target.value)}))}
                            className="w-full px-2 py-2 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                        </div>
                        <button onClick={applyPsCustom}
                          className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
                          <RefreshCw size={13} /> Apply
                        </button>
                      </div>
                    </div>

                    {/* ── Month Review Table ── */}
                    {psMonthRows.length > 0 && (
                      <div className="border-t border-cyan-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={13} /> {psMonthRows.length} Month{psMonthRows.length > 1 ? 's' : ''} Selected
                          </p>
                          <button onClick={() => { setPsMonthRows([]); setActivePsQuick(''); setPsResults(null); }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                            <Trash2 size={11} /> Clear
                          </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-cyan-200 shadow-sm">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-cyan-600 text-white">
                                <th className="px-3 py-2 text-left text-xs font-bold">#</th>
                                <th className="px-3 py-2 text-left text-xs font-bold">Month & Year</th>
                                <th className="px-3 py-2 text-center text-xs font-bold">Work Days</th>
                                <th className="px-3 py-2 text-center text-xs font-bold">Paid Days</th>
                                <th className="px-3 py-2 text-center text-xs font-bold">LOP</th>
                                <th className="px-3 py-2 text-right text-xs font-bold">Net Pay</th>
                                <th className="px-3 py-2 text-center text-xs font-bold">Status</th>
                                <th className="px-3 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {psMonthRows.map((row, idx) => {
                                const res = psResults?.results?.[idx];
                                return (
                                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-cyan-50/40'}>
                                    <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                                    <td className="px-3 py-2 font-semibold text-cyan-700 whitespace-nowrap">{row.pay_month} {row.pay_year}</td>
                                    <td className="px-3 py-2 text-center">
                                      <input type="number" value={row.working_days}
                                        onChange={e => updatePsRow(idx, 'working_days', e.target.value)}
                                        className="w-14 px-1.5 py-1 border border-cyan-200 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <input type="number" value={row.paid_days}
                                        onChange={e => updatePsRow(idx, 'paid_days', e.target.value)}
                                        className="w-14 px-1.5 py-1 border border-cyan-200 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400" />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <input type="number" value={row.lop_days}
                                        onChange={e => updatePsRow(idx, 'lop_days', e.target.value)}
                                        className="w-12 px-1.5 py-1 border border-red-200 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-red-300" />
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-emerald-700 text-xs whitespace-nowrap">
                                      ₹{inr2(row.net_pay)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {res && res.success && (
                                        <div className="flex items-center justify-center gap-1">
                                          <CheckCircle size={13} className="text-green-500" />
                                          <a href={res.url} target="_blank" rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline">View</a>
                                          <a href={res.url} download
                                            className="text-xs text-gray-500 hover:text-gray-700"><Download size={11} /></a>
                                        </div>
                                      )}
                                      {res && !res.success && <AlertCircle size={13} className="text-red-500 mx-auto" title={res.error} />}
                                      {generatingPs && !res && <Loader size={13} className="animate-spin text-cyan-500 mx-auto" />}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button onClick={() => setPsMonthRows(r => r.filter((_, i) => i !== idx))}
                                        className="text-red-400 hover:text-red-600 transition"><Trash2 size={13} /></button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gradient-to-r from-cyan-600 to-teal-700 text-white">
                                <td colSpan={5} className="px-3 py-2 text-xs font-bold">
                                  Total Net Pay — {psMonthRows.length} months
                                </td>
                                <td className="px-3 py-2 text-right text-sm font-bold">
                                  ₹{inr2(psMonthRows.reduce((s, r) => s + Number(r.net_pay || 0), 0))}
                                </td>
                                <td colSpan={2}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Generate Payslips Button */}
                        <button onClick={generatePayslips} disabled={generatingPs}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow transition disabled:opacity-60 text-sm"
                          style={{ background: 'linear-gradient(135deg, #0891b2, #0d9488)' }}>
                          {generatingPs ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                          {generatingPs ? `Generating ${psMonthRows.length} Payslips...` : `Generate All ${psMonthRows.length} Payslips`}
                        </button>

                        {/* ZIP Download */}
                        {psResults?.zipUrl && (
                          <a href={psResults.zipUrl} download
                            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm shadow hover:opacity-90 transition"
                            style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
                            <Archive size={16} /> Download All {psResults.generated} Payslips as ZIP
                          </a>
                        )}

                        {/* Result Summary */}
                        {psResults && (
                          <div className="mt-3 bg-white border border-cyan-200 rounded-xl px-4 py-3 flex items-center gap-3">
                            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700">
                              {psResults.generated}/{psResults.total} payslips generated
                              {psResults.total - psResults.generated > 0 && (
                                <span className="text-red-500 ml-2">({psResults.total - psResults.generated} failed)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Single-month hint for Generate All ── */}
                    <div className="border-t border-cyan-200 pt-4">
                      <p className="text-xs text-cyan-700 bg-cyan-100 rounded-lg px-3 py-2 mb-3 flex items-start gap-1.5">
                        <span className="mt-0.5">💡</span>
                        <span>
                          <strong>"Generate All 5 Documents"</strong> uses the <strong>most recent selected month</strong> for its payslip.
                          {payslip.pay_month ? <> Currently: <strong>{payslip.pay_month} {payslip.pay_year}</strong></> : ' Select a range above or set manually below.'}
                        </span>
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Field label="Pay Month" color={sec.text}>
                          <SSelect ring={sec.ring} name="pay_month" value={payslip.pay_month} onChange={ch(setPayslip)}>
                            <option value="">Select Month</option>
                            {MONTHS.map(m => <option key={m}>{m}</option>)}
                          </SSelect>
                        </Field>
                        <Field label="Pay Year" color={sec.text}>
                          <SInput ring={sec.ring} type="number" name="pay_year" value={payslip.pay_year} onChange={ch(setPayslip)} />
                        </Field>
                        <Field label="Amount in Words" color={sec.text}>
                          <SInput ring={sec.ring} name="amount_in_words" value={payslip.amount_in_words} onChange={ch(setPayslip)} placeholder="Rupees Twenty Thousand Only" />
                        </Field>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {[
                          { label: 'Gross Earnings', val: payslip.gross_earnings, bg: 'bg-green-500' },
                          { label: 'Deductions', val: payslip.total_deductions, bg: 'bg-red-500' },
                          { label: 'Net Pay', val: payslip.net_pay, bg: 'bg-blue-600' }
                        ].map(({ label, val, bg }) => (
                          <div key={label} className={`${bg} text-white rounded-xl p-3 text-center`}>
                            <div className="text-xs font-medium opacity-80 mb-1">{label}</div>
                            <div className="font-bold">₹{Number(val || 0).toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 5 – Offer Letter */}
            {(() => { const sec = SECTIONS[4]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <p className="text-xs text-orange-600 mb-4 bg-orange-100 rounded-lg px-3 py-2">
                      These values will appear in the Offer Letter. Leave blank to use employee record values.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Field label="Offered Designation" color={sec.text}>
                        <SInput ring={sec.ring} name="designation" value={offer.designation} onChange={ch(setOffer)} placeholder="Software Engineer" />
                      </Field>
                      <Field label="Offered Annual CTC" color={sec.text}>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-orange-400 font-bold text-sm">₹</span>
                          <SInput ring={sec.ring} type="number" name="ctc" value={offer.ctc} onChange={ch(setOffer)} className="pl-7" placeholder="500000" />
                        </div>
                      </Field>
                      <Field label="Joining Date" color={sec.text}>
                        <SInput ring={sec.ring} type="date" name="joining_date" value={offer.joining_date} onChange={ch(setOffer)} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 6 – Experience & Relieving */}
            {(() => { const sec = SECTIONS[5]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl space-y-5`}>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award size={16} className="text-rose-500" />
                        <span className="font-bold text-rose-700 text-sm">Experience Letter</span>
                      </div>
                      <Field label="Custom Summary Paragraph (optional)" color={sec.text}>
                        <textarea
                          name="summary" value={experience.summary} onChange={ch(setExp)} rows={3}
                          placeholder="Leave blank to use default paragraph. Or write: He / She was a diligent and hardworking..."
                          className={`w-full px-3 py-2.5 border border-rose-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${sec.ring} focus:border-transparent transition resize-none`}
                        />
                      </Field>
                    </div>
                    <div className="border-t border-rose-200 pt-5">
                      <div className="flex items-center gap-2 mb-3">
                        <LogOut size={16} className="text-rose-500" />
                        <span className="font-bold text-rose-700 text-sm">Relieving Letter</span>
                      </div>
                      <div className="max-w-xs">
                        <Field label="Last Working Day" color={sec.text}>
                          <SInput ring={sec.ring} type="date" name="relieving_date" value={relieving.relieving_date} onChange={ch(setRelieving)} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* ── SECTION 7 – Salary Increment ── */}
            <div className="rounded-2xl overflow-hidden shadow-md">
              <button type="button" onClick={() => toggle('increment')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><TrendingUp size={18} /></div>
                  <div className="text-left">
                    <div className="font-bold text-base">Salary Increment Letter</div>
                    <div className="text-xs text-white/80">Generate increment certificate with new CTC breakdown</div>
                  </div>
                </div>
                {open.increment ? <ChevronUp size={20} className="text-white/80" /> : <ChevronDown size={20} className="text-white/80" />}
              </button>

              {open.increment && (
                <div className="bg-teal-50 p-5 border border-teal-200 border-t-0 rounded-b-2xl space-y-4">

                  {/* Inputs */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Effective Date *" color="text-teal-700">
                      <SInput ring="focus:ring-teal-400" type="date" name="increment_date"
                        value={increment.increment_date} onChange={ch(setIncrement)} />
                    </Field>
                    <Field label="Increment Type" color="text-teal-700">
                      <div className="flex gap-2">
                        {[['percentage','% Percentage'],['flat','₹ Flat Amount']].map(([v,l]) => (
                          <button key={v} type="button"
                            onClick={() => setIncrement(p => ({ ...p, increment_type: v }))}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold border-2 transition
                              ${increment.increment_type === v
                                ? 'bg-teal-600 text-white border-teal-600 shadow'
                                : 'bg-white text-teal-700 border-teal-200 hover:border-teal-400'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field
                      label={increment.increment_type === 'percentage' ? 'Increment % *' : 'Monthly Flat Amount (₹) *'}
                      color="text-teal-700">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-teal-600 font-bold text-sm">
                          {increment.increment_type === 'percentage' ? '%' : '₹'}
                        </span>
                        <SInput ring="focus:ring-teal-400" type="number" name="increment_value"
                          value={increment.increment_value} onChange={ch(setIncrement)}
                          placeholder={increment.increment_type === 'percentage' ? 'e.g. 15' : 'e.g. 5000'}
                          className="pl-7" />
                      </div>
                    </Field>
                  </div>

                  {/* Live Preview */}
                  {curCtc > 0 && incVal > 0 && (
                    <div className="bg-white border border-teal-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <ArrowUpCircle size={14} /> Live Increment Preview
                      </p>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 font-medium mb-1">Current Annual CTC</p>
                          <p className="text-base font-bold text-gray-700">₹{inrFmt(curCtc)}</p>
                          <p className="text-xs text-gray-400">₹{inrFmt(curMonthly)}/mo</p>
                        </div>
                        <div className="bg-teal-50 border border-teal-300 rounded-xl p-3 text-center">
                          <p className="text-xs text-teal-600 font-medium mb-1">
                            {increment.increment_type === 'percentage' ? `+${incVal}%` : `+₹${inrFmt(incVal)}/mo`}
                          </p>
                          <p className="text-base font-bold text-teal-700">+₹{inrFmt(incAmt)}</p>
                          <p className="text-xs text-teal-500">annual increase</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-center">
                          <p className="text-xs text-emerald-600 font-medium mb-1">New Annual CTC</p>
                          <p className="text-base font-bold text-emerald-700">₹{inrFmt(newCtc)}</p>
                          <p className="text-xs text-emerald-500">₹{inrFmt(newMonthly)}/mo</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Monthly salary increases from <strong>₹{inrFmt(curMonthly)}</strong> → <strong className="text-emerald-700">₹{inrFmt(newMonthly)}</strong>
                        {increment.increment_type === 'percentage' && <span className="ml-1 text-teal-600 font-bold">(+{incVal}%)</span>}
                      </p>
                    </div>
                  )}

                  {/* Warning if no current CTC */}
                  {(!curCtc || curCtc === 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle size={14} />
                      Please fill the Annual CTC in the Salary Structure section above to see the increment preview.
                    </div>
                  )}

                  {/* Generate button */}
                  <button type="button" onClick={generateIncrement} disabled={generatingInc}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow transition disabled:opacity-60 text-sm"
                    style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}>
                    {generatingInc ? <Loader size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                    {generatingInc ? 'Generating...' : 'Generate Salary Increment Letter'}
                  </button>

                  {/* Result */}
                  {incResult && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">Increment Letter Generated!</span>
                      </div>
                      <div className="flex items-center justify-between mb-3 text-xs text-gray-600">
                        <span>Doc No: <strong>{incResult.doc_number}</strong></span>
                        <span>New CTC: <strong className="text-emerald-700">₹{inrFmt(incResult.new_ctc)}</strong></span>
                      </div>
                      <div className="flex gap-2">
                        <a href={incResult.url} target="_blank" rel="noreferrer"
                          className="flex-1 text-center text-sm font-bold text-white py-2 rounded-lg hover:opacity-90 transition"
                          style={{ background: '#0d9488' }}>
                          View PDF
                        </a>
                        <a href={incResult.url} download
                          className="flex-1 text-center text-sm font-bold text-gray-700 bg-white border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1.5">
                          <Download size={13} /> Download
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Generate Button */}
            <button onClick={generateAll} disabled={generating}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg shadow-xl transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed, #db2777)', color: 'white' }}>
              {generating ? <Loader size={22} className="animate-spin" /> : <FileDown size={22} />}
              {generating ? 'Generating All Documents...' : 'Generate All 5 Documents'}
            </button>
          </div>

          {/* RIGHT PANEL – Document Status */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <FileText size={16} /> Document Output
                </h3>
                <p className="text-gray-300 text-xs mt-0.5">5 docs: Offer · Payslip · Experience · Relieving · Increment</p>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(DOC_META).map(([key, { label, icon: Icon, color }]) => {
                  const result = results?.[key];
                  return (
                    <div key={key} className="rounded-xl border p-3 transition"
                      style={{ borderColor: color + '40', background: color + '08' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg" style={{ background: color + '20' }}>
                            <Icon size={14} style={{ color }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{label}</span>
                        </div>
                        {result && !result.error && <CheckCircle size={16} className="text-green-500" />}
                        {result?.error && <AlertCircle size={16} className="text-red-500" />}
                        {generating && !result && <Loader size={14} className="animate-spin text-gray-400" />}
                      </div>
                      {!result && !generating && (
                        <div className="text-xs text-gray-400 italic">
                          {key === 'salary_increment' ? 'Optional — fill Section 7' : 'Waiting to generate...'}
                        </div>
                      )}
                      {generating && !result && (
                        <div className="text-xs font-medium" style={{ color }}>Generating PDF...</div>
                      )}
                      {result && !result.error && (
                        <div className="space-y-2">
                          <div className="text-xs font-mono bg-white rounded px-2 py-1 border text-gray-600 truncate">{result.doc_number}</div>
                          <div className="flex gap-1.5">
                            <a href={result.url} target="_blank" rel="noreferrer"
                              className="flex-1 text-center text-xs font-semibold text-white py-1.5 rounded-lg hover:opacity-90 transition"
                              style={{ background: color }}>
                              View PDF
                            </a>
                            <a href={result.url} download
                              className="flex-1 text-center text-xs font-semibold text-gray-600 bg-gray-100 py-1.5 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1">
                              <Download size={11} /> Save
                            </a>
                          </div>
                        </div>
                      )}
                      {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payslip bulk summary */}
            {psMonthRows.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-cyan-100 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-teal-700 px-4 py-3">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <CreditCard size={15} /> Payslip Batch
                  </h3>
                  <p className="text-cyan-200 text-xs mt-0.5">{psMonthRows.length} months selected</p>
                </div>
                <div className="p-3 max-h-52 overflow-y-auto space-y-1">
                  {psMonthRows.map((r, i) => {
                    const res = psResults?.results?.[i];
                    return (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-medium text-gray-700">{r.pay_month} {r.pay_year}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-emerald-600 font-bold">₹{inr2(r.net_pay)}</span>
                          {res?.success && <CheckCircle size={11} className="text-green-500" />}
                          {res && !res.success && <AlertCircle size={11} className="text-red-500" />}
                          {generatingPs && !res && <Loader size={11} className="animate-spin text-cyan-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total Net Pay</span>
                    <span className="font-bold text-emerald-700">
                      ₹{inr2(psMonthRows.reduce((s, r) => s + Number(r.net_pay || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tips card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">Tips</p>
              <ul className="text-xs text-amber-800 space-y-1.5">
                <li>• Select an employee to auto-fill all fields</li>
                <li>• Choose 3M / 6M / 1Y / Tenure for bulk payslips</li>
                <li>• Full Tenure uses Date of Joining from employee details</li>
                <li>• Increment Letter is included if date & value filled</li>
                <li>• PDFs include company logo & signature</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
