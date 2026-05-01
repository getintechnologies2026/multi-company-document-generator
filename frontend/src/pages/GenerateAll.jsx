import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileDown, CheckCircle, AlertCircle, Loader,
  User, Building2, CreditCard, FileText, Award, LogOut,
  ChevronDown, ChevronUp, Sparkles, Download, TrendingUp,
  Calendar, Zap, Archive, Trash2, Plus, ArrowRight,
  Briefcase, UserCheck, Clock,
} from 'lucide-react';
import api from '../services/api';

/* ─────────────────────────── helpers ─────────────────────────── */
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const inrFmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });
const inr2   = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

/* ─────────────────────── lifecycle phases ─────────────────────── */
const PHASES = [
  {
    id: 'joining', step: 1, label: 'Joining', icon: Briefcase,
    desc: 'Employee details, salary structure & offer letter',
    color: '#3b82f6', bg: 'from-blue-500 to-indigo-700',
    light: 'bg-blue-50', border: 'border-blue-200',
    text: 'text-blue-700', ring: 'focus:ring-blue-400',
  },
  {
    id: 'payslips', step: 2, label: 'Payslips', icon: CreditCard,
    desc: 'Bulk payslip generation — select any month range',
    color: '#0891b2', bg: 'from-cyan-500 to-teal-700',
    light: 'bg-cyan-50', border: 'border-cyan-200',
    text: 'text-cyan-700', ring: 'focus:ring-cyan-400',
  },
  {
    id: 'increments', step: 3, label: 'Increments', icon: TrendingUp,
    desc: 'Multiple salary increments — CTC cascades automatically',
    color: '#059669', bg: 'from-emerald-500 to-green-700',
    light: 'bg-emerald-50', border: 'border-emerald-200',
    text: 'text-emerald-700', ring: 'focus:ring-emerald-400',
  },
  {
    id: 'exit', step: 4, label: 'Exit / Relieving', icon: LogOut,
    desc: 'Relieving process — Experience Letter + Relieving Letter',
    color: '#ef4444', bg: 'from-rose-500 to-pink-700',
    light: 'bg-rose-50', border: 'border-rose-200',
    text: 'text-rose-700', ring: 'focus:ring-rose-400',
  },
];

/* ──────────────────── payslip quick presets ───────────────────── */
const PAYSLIP_QUICK = [
  { id: 'last3',    label: '3 Months',       icon: '3️⃣', months: 3,  type: 'last'     },
  { id: 'last6',    label: '6 Months',       icon: '6️⃣', months: 6,  type: 'last'     },
  { id: 'last12',   label: '1 Year',         icon: '📅', months: 12, type: 'last'     },
  { id: 'curryear', label: 'Current Year',   icon: '🗓️', months: 0,  type: 'curryear' },
  { id: 'prevyear', label: 'Prev Year',      icon: '📆', months: 0,  type: 'prevyear' },
  { id: 'finyear',  label: 'Financial Year', icon: '💰', months: 0,  type: 'finyear'  },
  { id: 'tenure',   label: 'Full Tenure',    icon: '🏆', months: 0,  type: 'tenure'   },
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

/* ──────────────────── reusable form atoms ─────────────────────── */
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
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
        focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition ${props.className || ''}`}
    />
  );
}
function SSelect({ ring, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
        focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition`}
    >
      {children}
    </select>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function GenerateAll() {
  /* ── core ── */
  const [companies,   setCompanies]   = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [companyId,   setCompanyId]   = useState('');
  const [employeeId,  setEmployeeId]  = useState('');
  const [open, setOpen] = useState({ joining: true, payslips: true, increments: true, exit: true });

  /* ── Phase 1 – Joining ── */
  const [emp, setEmp] = useState({
    full_name:'', email:'', mobile:'', designation:'', department:'', emp_code:'',
    pan:'', uan:'', pf_no:'', date_of_joining:'', employment_type:'Full-Time',
    bank_name:'', bank_account:'', ifsc_code:'',
  });
  const [salary, setSalary] = useState({
    ctc:'', basic:'', hra:'', da:'', conveyance:'', medical:'', special_allowance:'',
    pf:'', esi:'', professional_tax:'', tds:'',
  });
  const [offer,       setOffer]      = useState({ joining_date:'', designation:'', ctc:'' });
  const [offerResult, setOfferResult] = useState(null);
  const [genOffer,    setGenOffer]    = useState(false);

  /* ── Phase 2 – Payslips ── */
  const [psMonthRows,     setPsMonthRows]     = useState([]);
  const [psResults,       setPsResults]       = useState(null);
  const [genPs,           setGenPs]           = useState(false);
  const [activePsQuick,   setActivePsQuick]   = useState('');
  const [psCustomFrom,    setPsCustomFrom]    = useState({ month: 0, year: new Date().getFullYear() });
  const [psCustomTo,      setPsCustomTo]      = useState({
    month: new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1,
    year:  new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear(),
  });

  /* ── Phase 3 – Increments (multiple rows) ── */
  const [incRows,   setIncRows]   = useState([{ id: Date.now(), increment_date:'', new_designation:'', new_ctc:'' }]);
  const [incResults, setIncResults] = useState([]);
  const [genInc,    setGenInc]    = useState(false);

  /* ── Phase 4 – Exit ── */
  const [exit,       setExit]       = useState({
    notice_period:'', lwd_date:'', relieving_date:'',
    relieving_designation:'', relieving_ctc:'', experience_summary:'',
  });
  const [exitResults, setExitResults] = useState(null);
  const [genExit,    setGenExit]    = useState(false);

  /* ── salary totals ── */
  const salaryGross = ['basic','hra','da','conveyance','medical','special_allowance']
    .reduce((s, k) => s + Number(salary[k] || 0), 0);
  const salaryDed = ['pf','esi','professional_tax','tds']
    .reduce((s, k) => s + Number(salary[k] || 0), 0);
  const salaryNet = salaryGross - salaryDed;

  /* ── data fetch ── */
  useEffect(() => { api.get('/companies').then(({ data }) => setCompanies(data)); }, []);

  useEffect(() => {
    if (!companyId) { setEmployees([]); return; }
    api.get('/employees', { params: { company_id: companyId } }).then(({ data }) => setEmployees(data));
    setEmployeeId('');
  }, [companyId]);

  /* ── auto-fill on employee select ── */
  useEffect(() => {
    if (!employeeId) return;
    const e = employees.find(x => x.id == employeeId);
    if (!e) return;
    const fmt = d => d ? d.split('T')[0] : '';
    setEmp({
      full_name: e.full_name||'', email: e.email||'', mobile: e.mobile||'',
      designation: e.designation||'', department: e.department||'',
      emp_code: e.emp_code||'', pan: e.pan||'', uan: e.uan||'', pf_no: e.pf_no||'',
      date_of_joining: fmt(e.date_of_joining), employment_type: e.employment_type||'Full-Time',
      bank_name: e.bank_name||'', bank_account: e.bank_account||'', ifsc_code: e.ifsc_code||'',
    });
    setSalary({
      ctc: e.ctc||'', basic: e.basic||'', hra: e.hra||'', da: e.da||'',
      conveyance: e.conveyance||'', medical: e.medical||'', special_allowance: e.special_allowance||'',
      pf: e.pf||'', esi: e.esi||'', professional_tax: e.professional_tax||'', tds: e.tds||'',
    });
    setOffer(o => ({ ...o, joining_date: fmt(e.date_of_joining), designation: e.designation||'', ctc: e.ctc||'' }));
    setExit(ex => ({ ...ex, relieving_designation: e.designation||'', relieving_ctc: e.ctc||'' }));
    toast.success('Employee details auto-filled!');
  }, [employeeId]); // eslint-disable-line

  /* ── sync payslip rows when salary changes ── */
  useEffect(() => {
    if (!psMonthRows.length) return;
    setPsMonthRows(rows => rows.map(r => ({
      ...r,
      gross_earnings: salaryGross.toFixed(2),
      total_deductions: salaryDed.toFixed(2),
      net_pay: salaryNet.toFixed(2),
    })));
  }, [salaryGross, salaryDed, salaryNet]); // eslint-disable-line

  const ch     = setter => e => setter(p => ({ ...p, [e.target.name]: e.target.value }));
  const toggle = id => setOpen(o => ({ ...o, [id]: !o[id] }));

  /* ════════════════════════════════════════════════════════════ */
  /*  Phase 1 — Generate Offer Letter                            */
  /* ════════════════════════════════════════════════════════════ */
  const generateOffer = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name required');
    setGenOffer(true); setOfferResult(null);
    try {
      const { data } = await api.post('/documents/generate', {
        doc_type: 'offer_letter',
        company_id: companyId,
        employee_id: employeeId || null,
        data: {
          ...emp, ...salary,
          employee_name:       emp.full_name,
          designation:         offer.designation || emp.designation,
          offered_designation: offer.designation || emp.designation,
          joining_date:        offer.joining_date || emp.date_of_joining,
          offered_ctc:         offer.ctc || salary.ctc,
          gross:               salaryGross,
          net:                 salaryNet,
        },
      });
      setOfferResult(data);
      toast.success('Offer Letter generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally { setGenOffer(false); }
  };

  /* ════════════════════════════════════════════════════════════ */
  /*  Phase 2 — Payslips                                         */
  /* ════════════════════════════════════════════════════════════ */
  const applyPsQuick = (opt) => {
    setActivePsQuick(opt.id);
    const rows = buildPayslipRows(opt.type, opt.months, emp.date_of_joining);
    if (!rows.length) {
      toast.error(opt.type === 'tenure' && !emp.date_of_joining
        ? 'Fill Date of Joining first' : 'No months found');
      return;
    }
    setPsMonthRows(rows.map(r => ({
      ...r,
      gross_earnings: salaryGross.toFixed(2),
      total_deductions: salaryDed.toFixed(2),
      net_pay: salaryNet.toFixed(2),
      amount_in_words: '',
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
        amount_in_words: '',
      });
      m++; if (m > 11) { m = 0; y++; }
      if (rows.length > 60) break;
    }
    if (!rows.length) return toast.error('Invalid date range');
    setPsMonthRows(rows);
    setActivePsQuick('custom');
    setPsResults(null);
    toast(`${rows.length} month${rows.length > 1 ? 's' : ''} loaded`, { icon: '📅' });
  };

  const generatePayslips = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name required');
    if (!psMonthRows.length) return toast.error('Select a month range first');
    setGenPs(true); setPsResults(null);
    try {
      const { data } = await api.post('/documents/generate-payslips-bulk', {
        company_id: companyId, employee_id: employeeId || null,
        employee: { ...emp, ...salary },
        months: psMonthRows,
      });
      setPsResults(data);
      toast.success(`${data.generated} payslip${data.generated > 1 ? 's' : ''} generated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payslip generation failed');
    } finally { setGenPs(false); }
  };

  /* ════════════════════════════════════════════════════════════ */
  /*  Phase 3 — Multiple Increment Letters                        */
  /* ════════════════════════════════════════════════════════════ */
  const addIncRow    = () => setIncRows(r => [...r, { id: Date.now(), increment_date:'', new_designation:'', new_ctc:'' }]);
  const removeIncRow = id  => setIncRows(r => r.filter(x => x.id !== id));
  const updateIncRow = (id, field, val) => setIncRows(r => r.map(x => x.id === id ? { ...x, [field]: val } : x));

  /* CTC cascade: each row's "from" is the previous row's new CTC (or joining CTC for row 0) */
  const joiningCtc = Number(offer.ctc || salary.ctc || 0);
  const incChain = incRows.reduce((acc, row, i) => {
    const fromCtc   = i === 0 ? joiningCtc : (Number(acc[i - 1].newCtcVal) || joiningCtc);
    const newCtcVal = Number(row.new_ctc) || fromCtc;
    const diff      = newCtcVal - fromCtc;
    const pctChange = fromCtc > 0 ? ((diff / fromCtc) * 100).toFixed(1) : '0.0';
    acc.push({ ...row, fromCtc, newCtcVal, diff, pctChange });
    return acc;
  }, []);

  const generateIncrements = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name required');
    const validRows = incChain.filter(r => r.increment_date && r.new_ctc);
    if (!validRows.length) return toast.error('Fill at least one increment row (date + new CTC)');
    setGenInc(true);
    const results = [];
    for (const row of validRows) {
      try {
        const flatMonthly = Math.max(0, Math.round((row.newCtcVal - row.fromCtc) / 12));
        const { data } = await api.post('/documents/generate-salary-increment', {
          company_id: companyId,
          employee_id: employeeId || null,
          employee: { ...emp, ...salary, ctc: row.fromCtc, designation: row.new_designation || emp.designation },
          increment: {
            increment_date:  row.increment_date,
            increment_type:  'flat',
            increment_value: flatMonthly,
          },
        });
        results.push({ ...data, rowId: row.id, success: true, fromCtc: row.fromCtc, newCtcVal: row.newCtcVal });
      } catch (err) {
        results.push({ rowId: row.id, success: false, error: err.response?.data?.error || err.message });
      }
    }
    setIncResults(results);
    const ok = results.filter(r => r.success).length;
    if (ok === results.length) toast.success(`${ok} increment letter${ok > 1 ? 's' : ''} generated!`);
    else toast.error(`${ok}/${results.length} increment letters generated`);
    setGenInc(false);
  };

  /* ════════════════════════════════════════════════════════════ */
  /*  Phase 4 — Exit Documents                                    */
  /* ════════════════════════════════════════════════════════════ */
  const generateExit = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name required');
    setGenExit(true); setExitResults(null);
    const exResults = {};
    const empPayload = { ...emp, ...salary };
    const relDate    = exit.relieving_date || exit.lwd_date || '';

    /* Experience Letter */
    try {
      const { data } = await api.post('/documents/generate', {
        doc_type: 'experience_letter', company_id: companyId, employee_id: employeeId || null,
        data: {
          ...empPayload,
          employee_name:    emp.full_name,
          designation:      exit.relieving_designation || emp.designation,
          date_of_joining:  emp.date_of_joining,
          date_of_leaving:  relDate,
          relieving_date:   relDate,
          summary:          exit.experience_summary || '',
        },
      });
      exResults.experience_letter = data;
    } catch (err) {
      exResults.experience_letter = { error: err.response?.data?.error || err.message };
    }

    /* Relieving Letter */
    try {
      const { data } = await api.post('/documents/generate', {
        doc_type: 'relieving_letter', company_id: companyId, employee_id: employeeId || null,
        data: {
          ...empPayload,
          employee_name:         emp.full_name,
          designation:           exit.relieving_designation || emp.designation,
          date_of_joining:       emp.date_of_joining,
          notice_period:         exit.notice_period,
          lwd_date:              exit.lwd_date,
          relieving_date:        relDate,
          last_ctc:              exit.relieving_ctc || salary.ctc,
        },
      });
      exResults.relieving_letter = data;
    } catch (err) {
      exResults.relieving_letter = { error: err.response?.data?.error || err.message };
    }

    setExitResults(exResults);
    const ok = Object.values(exResults).filter(r => !r.error).length;
    if (ok === 2) toast.success('Experience & Relieving Letters generated!');
    else toast.error(`${ok}/2 exit documents generated`);
    setGenExit(false);
  };

  /* ════════════════════════════════════════════════════════════ */
  /*  Shared sub-components                                       */
  /* ════════════════════════════════════════════════════════════ */
  const PhaseHeader = ({ phase, docCount, isGenerated }) => (
    <button type="button" onClick={() => toggle(phase.id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${phase.bg} text-white shadow-md`}>
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg"><phase.icon size={18} /></div>
        <div className="text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Step {phase.step}
            </span>
            <span className="font-bold text-base">{phase.label}</span>
          </div>
          <div className="text-xs text-white/80 mt-0.5">
            {isGenerated
              ? <span className="flex items-center gap-1">✓ {docCount} document{docCount !== 1 ? 's' : ''} generated</span>
              : phase.desc}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isGenerated && <CheckCircle size={16} className="text-white/90" />}
        {open[phase.id] ? <ChevronUp size={20} className="text-white/80" /> : <ChevronDown size={20} className="text-white/80" />}
      </div>
    </button>
  );

  /* ════════════════════════════════════════════════════════════ */
  /*  RENDER                                                      */
  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#fff0f5 100%)' }}>

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-brand-800 via-purple-700 to-pink-600 text-white px-6 py-6 mb-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles size={24} /> Employee Lifecycle Documents
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            One employee · Full tenure · Joining → Payslips → Increments → Exit
          </p>

          {/* Timeline stepper */}
          <div className="mt-4 flex items-center gap-0 overflow-x-auto pb-1 scrollbar-none">
            {PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => document.getElementById(`phase-${phase.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-xl px-3 py-2 transition">
                  <span className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold shrink-0">
                    {phase.step}
                  </span>
                  <phase.icon size={14} className="shrink-0" />
                  <span className="text-sm font-semibold whitespace-nowrap">{phase.label}</span>
                </button>
                {i < PHASES.length - 1 && <ArrowRight size={16} className="text-white/40 mx-1 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ══════════════════════════════════════════════════════ */}
          {/*  FORM COLUMN                                           */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Company & Employee ── */}
            <div className="rounded-2xl overflow-hidden shadow-md">
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-4 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Building2 size={18} className="text-white" /></div>
                <div>
                  <div className="text-white font-bold">Company &amp; Employee</div>
                  <div className="text-white/70 text-xs">Select to auto-fill all fields below</div>
                </div>
              </div>
              <div className="bg-violet-50 p-5 border border-violet-200 border-t-0 rounded-b-2xl">
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Company" color="text-violet-700">
                    <SSelect ring="focus:ring-violet-400" value={companyId} onChange={e => setCompanyId(e.target.value)}>
                      <option value="">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </SSelect>
                  </Field>
                  <Field label="Employee (auto-fills form)" color="text-violet-700">
                    <SSelect ring="focus:ring-violet-400" value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)} disabled={!companyId}>
                      <option value="">Select or fill manually below</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.emp_code}</option>)}
                    </SSelect>
                  </Field>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/*  STEP 1 — JOINING                                      */}
            {/* ══════════════════════════════════════════════════════ */}
            {(() => {
              const phase = PHASES[0];
              return (
                <div id={`phase-${phase.id}`} className="rounded-2xl overflow-hidden shadow-md">
                  <PhaseHeader phase={phase} docCount={offerResult ? 1 : 0} isGenerated={!!offerResult} />
                  {open[phase.id] && (
                    <div className={`${phase.light} border ${phase.border} border-t-0 rounded-b-2xl divide-y divide-blue-100`}>

                      {/* Employee Details */}
                      <div className="p-5">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <User size={13} /> Employee Details
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          {[
                            ['full_name','Full Name *','Rajesh Kumar'],
                            ['emp_code','Employee Code','EMP001'],
                            ['designation','Designation','Software Engineer'],
                            ['department','Department','Technology'],
                            ['email','Email ID','rajesh@company.com'],
                            ['mobile','Mobile No','9876543210'],
                          ].map(([name, label, ph]) => (
                            <Field key={name} label={label} color={phase.text}>
                              <SInput ring={phase.ring} name={name} value={emp[name]} onChange={ch(setEmp)} placeholder={ph} />
                            </Field>
                          ))}
                          <Field label="Date of Joining" color={phase.text}>
                            <SInput ring={phase.ring} type="date" name="date_of_joining" value={emp.date_of_joining} onChange={ch(setEmp)} />
                          </Field>
                          <Field label="Employment Type" color={phase.text}>
                            <SSelect ring={phase.ring} name="employment_type" value={emp.employment_type} onChange={ch(setEmp)}>
                              <option>Full-Time</option><option>Part-Time</option><option>Contract</option>
                            </SSelect>
                          </Field>
                          <Field label="PAN Number" color={phase.text}>
                            <SInput ring={phase.ring} name="pan" value={emp.pan} onChange={ch(setEmp)} placeholder="ABCDE1234F" />
                          </Field>
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-100">
                          <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${phase.text}`}>Bank Details</p>
                          <div className="grid md:grid-cols-3 gap-4">
                            <Field label="Bank Name" color={phase.text}>
                              <SInput ring={phase.ring} name="bank_name" value={emp.bank_name} onChange={ch(setEmp)} placeholder="HDFC Bank" />
                            </Field>
                            <Field label="Account Number" color={phase.text}>
                              <SInput ring={phase.ring} name="bank_account" value={emp.bank_account} onChange={ch(setEmp)} />
                            </Field>
                            <Field label="IFSC Code" color={phase.text}>
                              <SInput ring={phase.ring} name="ifsc_code" value={emp.ifsc_code} onChange={ch(setEmp)} placeholder="HDFC0001234" />
                            </Field>
                          </div>
                        </div>
                      </div>

                      {/* Salary Structure */}
                      <div className="p-5">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <CreditCard size={13} /> Joining Salary Structure
                          <span className="text-blue-400 font-normal normal-case ml-1">(used for payslips &amp; all letters)</span>
                        </p>
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-emerald-600 mb-2">Earnings</p>
                          <div className="grid md:grid-cols-4 gap-3">
                            {[
                              ['ctc','Annual CTC'],['basic','Basic'],['hra','HRA'],['da','DA'],
                              ['conveyance','Conveyance'],['medical','Medical'],['special_allowance','Special Allow.'],
                            ].map(([name, label]) => (
                              <Field key={name} label={label} color="text-emerald-700">
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-emerald-400 font-bold text-sm">₹</span>
                                  <SInput ring="focus:ring-emerald-400" type="number" name={name}
                                    value={salary[name]} onChange={ch(setSalary)} className="pl-7" placeholder="0" />
                                </div>
                              </Field>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-red-500 mb-2">Deductions</p>
                          <div className="grid md:grid-cols-4 gap-3">
                            {[['pf','PF'],['esi','ESI'],['professional_tax','Prof. Tax'],['tds','TDS']].map(([name, label]) => (
                              <Field key={name} label={label} color="text-red-500">
                                <div className="relative">
                                  <span className="absolute left-3 top-2.5 text-red-300 font-bold text-sm">₹</span>
                                  <SInput ring="focus:ring-red-300" type="number" name={name}
                                    value={salary[name]} onChange={ch(setSalary)} className="pl-7 border-red-100" placeholder="0" />
                                </div>
                              </Field>
                            ))}
                          </div>
                        </div>
                        {salaryGross > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {[['Gross','bg-emerald-500',salaryGross],['Deductions','bg-red-500',salaryDed],['Net Pay','bg-blue-600',salaryNet]].map(([l,bg,v]) => (
                              <div key={l} className={`${bg} text-white rounded-xl p-3 text-center`}>
                                <div className="text-xs font-medium opacity-80 mb-0.5">{l}</div>
                                <div className="font-bold text-sm">₹{inrFmt(v)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Offer Letter */}
                      <div className="p-5">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FileText size={13} /> Offer Letter Details
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          <Field label="Joining Date" color={phase.text}>
                            <SInput ring={phase.ring} type="date" name="joining_date"
                              value={offer.joining_date} onChange={ch(setOffer)} />
                          </Field>
                          <Field label="Offered Designation" color={phase.text}>
                            <SInput ring={phase.ring} name="designation"
                              value={offer.designation} onChange={ch(setOffer)} placeholder="Software Engineer" />
                          </Field>
                          <Field label="Offered Annual CTC" color={phase.text}>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-blue-400 font-bold text-sm">₹</span>
                              <SInput ring={phase.ring} type="number" name="ctc"
                                value={offer.ctc} onChange={ch(setOffer)} className="pl-7" placeholder="500000" />
                            </div>
                          </Field>
                        </div>
                        <button onClick={generateOffer} disabled={genOffer}
                          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow transition disabled:opacity-60 text-sm"
                          style={{ background: 'linear-gradient(135deg,#3b82f6,#4f46e5)' }}>
                          {genOffer ? <Loader size={16} className="animate-spin" /> : <FileDown size={16} />}
                          {genOffer ? 'Generating...' : 'Generate Offer Letter'}
                        </button>
                        {offerResult && (
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle size={14} className="text-blue-500 shrink-0" />
                              <span className="text-sm font-semibold text-blue-700 truncate">{offerResult.doc_number}</span>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <a href={offerResult.url} target="_blank" rel="noreferrer"
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition">View</a>
                              <a href={offerResult.url} download
                                className="text-xs bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-1">
                                <Download size={11} /> Save</a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════ */}
            {/*  STEP 2 — PAYSLIPS                                     */}
            {/* ══════════════════════════════════════════════════════ */}
            {(() => {
              const phase = PHASES[1];
              const psOk  = psResults?.generated ?? 0;
              return (
                <div id={`phase-${phase.id}`} className="rounded-2xl overflow-hidden shadow-md">
                  <PhaseHeader phase={phase} docCount={psOk} isGenerated={psOk > 0} />
                  {open[phase.id] && (
                    <div className={`${phase.light} p-5 border ${phase.border} border-t-0 rounded-b-2xl space-y-5`}>

                      {/* Quick select */}
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

                      {/* Custom range */}
                      <div className="border-t border-cyan-200 pt-4">
                        <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-3">Custom Range</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                          {[['From Month',psCustomFrom.month,v=>setPsCustomFrom(f=>({...f,month:Number(v)})),true],
                            ['From Year',psCustomFrom.year,v=>setPsCustomFrom(f=>({...f,year:Number(v)})),false],
                            ['To Month',psCustomTo.month,v=>setPsCustomTo(f=>({...f,month:Number(v)})),true],
                            ['To Year',psCustomTo.year,v=>setPsCustomTo(f=>({...f,year:Number(v)})),false],
                          ].map(([lbl,val,onChange,isMonth]) => (
                            <div key={lbl}>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">{lbl}</label>
                              {isMonth ? (
                                <select value={val} onChange={e=>onChange(e.target.value)}
                                  className="w-full px-2 py-2 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                                  {MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
                                </select>
                              ) : (
                                <input type="number" value={val} onChange={e=>onChange(e.target.value)}
                                  className="w-full px-2 py-2 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                              )}
                            </div>
                          ))}
                          <button onClick={applyPsCustom}
                            className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition">
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Month review table */}
                      {psMonthRows.length > 0 && (
                        <div className="border-t border-cyan-200 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                              {psMonthRows.length} Month{psMonthRows.length > 1 ? 's' : ''} Selected
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
                                  {['#','Month','Work Days','Paid Days','LOP','Net Pay','Status',''].map(h => (
                                    <th key={h} className="px-3 py-2 text-xs font-bold text-left">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {psMonthRows.map((row, idx) => {
                                  const res = psResults?.results?.[idx];
                                  return (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-cyan-50/40'}>
                                      <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                                      <td className="px-3 py-2 font-semibold text-cyan-700 whitespace-nowrap">{row.pay_month} {row.pay_year}</td>
                                      {[
                                        ['working_days','cyan'],['paid_days','cyan'],['lop_days','red'],
                                      ].map(([field, color]) => (
                                        <td key={field} className="px-3 py-2 text-center">
                                          <input type="number" value={row[field]}
                                            onChange={e => setPsMonthRows(rows => rows.map((r,i) => i===idx ? {...r,[field]:e.target.value} : r))}
                                            className={`w-14 px-1.5 py-1 border border-${color}-200 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-${color}-400`} />
                                        </td>
                                      ))}
                                      <td className="px-3 py-2 text-right font-bold text-emerald-700 text-xs whitespace-nowrap">
                                        ₹{inr2(row.net_pay)}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {res?.success && (
                                          <div className="flex items-center justify-center gap-1">
                                            <CheckCircle size={13} className="text-green-500" />
                                            <a href={res.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                                            <a href={res.url} download className="text-xs text-gray-500 hover:text-gray-700"><Download size={11} /></a>
                                          </div>
                                        )}
                                        {res && !res.success && <AlertCircle size={13} className="text-red-500 mx-auto" title={res.error} />}
                                        {genPs && !res && <Loader size={13} className="animate-spin text-cyan-500 mx-auto" />}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <button onClick={() => setPsMonthRows(r => r.filter((_,i) => i !== idx))}
                                          className="text-red-400 hover:text-red-600 transition"><Trash2 size={13} /></button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gradient-to-r from-cyan-600 to-teal-700 text-white">
                                  <td colSpan={5} className="px-3 py-2 text-xs font-bold">Total — {psMonthRows.length} months</td>
                                  <td className="px-3 py-2 text-right text-sm font-bold">
                                    ₹{inr2(psMonthRows.reduce((s,r) => s + Number(r.net_pay || 0), 0))}
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          <button onClick={generatePayslips} disabled={genPs}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow transition disabled:opacity-60 text-sm"
                            style={{ background: 'linear-gradient(135deg,#0891b2,#0d9488)' }}>
                            {genPs ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                            {genPs ? `Generating ${psMonthRows.length} Payslips...` : `Generate All ${psMonthRows.length} Payslips`}
                          </button>
                          {psResults?.zipUrl && (
                            <a href={psResults.zipUrl} download
                              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white text-sm shadow hover:opacity-90 transition"
                              style={{ background: 'linear-gradient(135deg,#059669,#0891b2)' }}>
                              <Archive size={16} /> Download All {psResults.generated} Payslips as ZIP
                            </a>
                          )}
                          {psResults && (
                            <div className="mt-3 bg-white border border-cyan-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
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
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════ */}
            {/*  STEP 3 — SALARY INCREMENTS                           */}
            {/* ══════════════════════════════════════════════════════ */}
            {(() => {
              const phase  = PHASES[2];
              const okCount = incResults.filter(r => r.success).length;
              return (
                <div id={`phase-${phase.id}`} className="rounded-2xl overflow-hidden shadow-md">
                  <PhaseHeader phase={phase} docCount={okCount} isGenerated={okCount > 0} />
                  {open[phase.id] && (
                    <div className={`${phase.light} p-5 border ${phase.border} border-t-0 rounded-b-2xl space-y-4`}>

                      <p className="text-xs text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                        <TrendingUp size={12} className="shrink-0 mt-0.5" />
                        Enter each salary increment. New CTC auto-cascades row-by-row from the Joining CTC.
                        {joiningCtc > 0 && <span className="font-bold ml-1">Joining CTC: ₹{inrFmt(joiningCtc)}</span>}
                      </p>

                      {/* Increment rows */}
                      <div className="space-y-3">
                        {incChain.map((row, idx) => {
                          const res = incResults.find(r => r.rowId === row.id);
                          return (
                            <div key={row.id} className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                              {/* Row header bar */}
                              <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 flex items-center justify-between">
                                <span className="text-white font-bold text-sm flex items-center gap-2 flex-wrap">
                                  <span className="bg-white/25 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                                    {idx + 1}
                                  </span>
                                  Increment {idx + 1}
                                  {row.fromCtc > 0 && row.new_ctc && (
                                    <span className="text-emerald-100 text-xs font-normal">
                                      ₹{inrFmt(row.fromCtc)} → ₹{inrFmt(row.newCtcVal)}
                                      <span className="text-green-200 ml-1">(+{row.pctChange}%)</span>
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-2">
                                  {res?.success && <CheckCircle size={14} className="text-white" />}
                                  {incRows.length > 1 && (
                                    <button onClick={() => removeIncRow(row.id)}
                                      className="text-white/70 hover:text-white transition">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Row fields */}
                              <div className="p-4">
                                <div className="grid md:grid-cols-3 gap-4">
                                  <Field label="Increment Effective Date *" color="text-emerald-700">
                                    <SInput ring="focus:ring-emerald-400" type="date" value={row.increment_date}
                                      onChange={e => updateIncRow(row.id, 'increment_date', e.target.value)} />
                                  </Field>
                                  <Field label="New Designation (after increment)" color="text-emerald-700">
                                    <SInput ring="focus:ring-emerald-400" value={row.new_designation}
                                      onChange={e => updateIncRow(row.id, 'new_designation', e.target.value)}
                                      placeholder={emp.designation || 'Senior Engineer'} />
                                  </Field>
                                  <Field label="New Annual CTC *" color="text-emerald-700">
                                    <div className="relative">
                                      <span className="absolute left-3 top-2.5 text-emerald-500 font-bold text-sm">₹</span>
                                      <SInput ring="focus:ring-emerald-400" type="number" value={row.new_ctc}
                                        onChange={e => updateIncRow(row.id, 'new_ctc', e.target.value)}
                                        className="pl-7" placeholder={row.fromCtc > 0 ? String(row.fromCtc + 60000) : '600000'} />
                                    </div>
                                  </Field>
                                </div>

                                {/* CTC cascade preview cards */}
                                {row.fromCtc > 0 && row.new_ctc && row.newCtcVal !== row.fromCtc && (
                                  <div className="mt-3 grid grid-cols-3 gap-2">
                                    <div className="bg-gray-100 rounded-lg p-2.5 text-center">
                                      <div className="text-xs text-gray-500 mb-0.5">Previous CTC</div>
                                      <div className="font-bold text-sm text-gray-700">₹{inrFmt(row.fromCtc)}</div>
                                      <div className="text-xs text-gray-400">₹{inrFmt(Math.round(row.fromCtc/12))}/mo</div>
                                    </div>
                                    <div className="bg-emerald-100 rounded-lg p-2.5 text-center border border-emerald-300">
                                      <div className="text-xs text-emerald-600 mb-0.5">Increment</div>
                                      <div className="font-bold text-sm text-emerald-700">+₹{inrFmt(row.diff)}</div>
                                      <div className="text-xs text-emerald-500">+{row.pctChange}% / year</div>
                                    </div>
                                    <div className="bg-emerald-500 rounded-lg p-2.5 text-center">
                                      <div className="text-xs text-emerald-100 mb-0.5">New CTC</div>
                                      <div className="font-bold text-sm text-white">₹{inrFmt(row.newCtcVal)}</div>
                                      <div className="text-xs text-emerald-100">₹{inrFmt(Math.round(row.newCtcVal/12))}/mo</div>
                                    </div>
                                  </div>
                                )}

                                {/* Per-row result */}
                                {res && (
                                  <div className={`mt-3 rounded-lg p-3 flex items-center justify-between gap-3
                                    ${res.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                                    {res.success ? (
                                      <>
                                        <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5 truncate">
                                          <CheckCircle size={14} className="shrink-0" /> {res.doc_number}
                                        </span>
                                        <div className="flex gap-1.5 shrink-0">
                                          <a href={res.url} target="_blank" rel="noreferrer"
                                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700 transition">View</a>
                                          <a href={res.url} download
                                            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-1">
                                            <Download size={11} /> Save</a>
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-sm text-red-600 flex items-center gap-1.5">
                                        <AlertCircle size={14} className="shrink-0" /> {res.error}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add row + Generate buttons */}
                      <div className="flex gap-3">
                        <button onClick={addIncRow}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-400 transition">
                          <Plus size={16} /> Add Increment
                        </button>
                        <button onClick={generateIncrements} disabled={genInc}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white shadow transition disabled:opacity-60 text-sm"
                          style={{ background: 'linear-gradient(135deg,#059669,#0d9488)' }}>
                          {genInc ? <Loader size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                          {genInc ? 'Generating...' : `Generate ${incRows.filter(r => r.increment_date && r.new_ctc).length || incRows.length} Increment Letter${incRows.length > 1 ? 's' : ''}`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════ */}
            {/*  STEP 4 — EXIT / RELIEVING                            */}
            {/* ══════════════════════════════════════════════════════ */}
            {(() => {
              const phase   = PHASES[3];
              const okCount = exitResults ? Object.values(exitResults).filter(r => !r.error).length : 0;
              return (
                <div id={`phase-${phase.id}`} className="rounded-2xl overflow-hidden shadow-md">
                  <PhaseHeader phase={phase} docCount={okCount} isGenerated={okCount > 0} />
                  {open[phase.id] && (
                    <div className={`${phase.light} p-5 border ${phase.border} border-t-0 rounded-b-2xl space-y-5`}>

                      {/* Relieving details */}
                      <div>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Clock size={13} /> Relieving Details
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          <Field label="Notice Period" color={phase.text}>
                            <SInput ring={phase.ring} name="notice_period" value={exit.notice_period}
                              onChange={ch(setExit)} placeholder="30 days / 2 months" />
                          </Field>
                          <Field label="Last Working Day (LWD)" color={phase.text}>
                            <SInput ring={phase.ring} type="date" name="lwd_date"
                              value={exit.lwd_date} onChange={ch(setExit)} />
                          </Field>
                          <Field label="Official Relieving Date" color={phase.text}>
                            <SInput ring={phase.ring} type="date" name="relieving_date"
                              value={exit.relieving_date} onChange={ch(setExit)} />
                          </Field>
                          <Field label="Relieving Designation" color={phase.text}>
                            <SInput ring={phase.ring} name="relieving_designation"
                              value={exit.relieving_designation} onChange={ch(setExit)}
                              placeholder={emp.designation || 'Senior Engineer'} />
                          </Field>
                          <Field label="Last Annual CTC (at exit)" color={phase.text}>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-rose-400 font-bold text-sm">₹</span>
                              <SInput ring={phase.ring} type="number" name="relieving_ctc"
                                value={exit.relieving_ctc} onChange={ch(setExit)}
                                className="pl-7" placeholder={String(salary.ctc || '')} />
                            </div>
                          </Field>
                        </div>
                      </div>

                      {/* Experience summary */}
                      <div className="border-t border-rose-200 pt-4">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Award size={13} /> Experience Letter — Custom Summary (Optional)
                        </p>
                        <textarea
                          name="experience_summary" value={exit.experience_summary} onChange={ch(setExit)} rows={3}
                          placeholder="Leave blank for default text. Or write: He / She was a diligent and hardworking employee..."
                          className={`w-full px-3 py-2.5 border border-rose-200 rounded-lg text-sm bg-white shadow-sm
                            focus:outline-none focus:ring-2 ${phase.ring} resize-none transition`}
                        />
                      </div>

                      {/* Generate button */}
                      <button onClick={generateExit} disabled={genExit}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white shadow transition disabled:opacity-60 text-sm"
                        style={{ background: 'linear-gradient(135deg,#ef4444,#db2777)' }}>
                        {genExit ? <Loader size={16} className="animate-spin" /> : <FileDown size={16} />}
                        {genExit ? 'Generating Exit Documents...' : 'Generate Experience Letter + Relieving Letter'}
                      </button>

                      {/* Exit results */}
                      {exitResults && (
                        <div className="grid md:grid-cols-2 gap-3">
                          {[
                            { key: 'experience_letter', label: 'Experience Letter', icon: Award,  color: '#f59e0b' },
                            { key: 'relieving_letter',  label: 'Relieving Letter',  icon: LogOut, color: '#ef4444' },
                          ].map(({ key, label, icon: Icon, color }) => {
                            const r = exitResults[key];
                            return (
                              <div key={key} className="bg-white border border-rose-200 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon size={14} style={{ color }} />
                                  <span className="text-xs font-bold text-gray-700">{label}</span>
                                  {r && !r.error && <CheckCircle size={12} className="text-green-500 ml-auto" />}
                                  {r?.error && <AlertCircle size={12} className="text-red-500 ml-auto" />}
                                </div>
                                {r && !r.error ? (
                                  <>
                                    <div className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1 mb-2 truncate">{r.doc_number}</div>
                                    <div className="flex gap-2">
                                      <a href={r.url} target="_blank" rel="noreferrer"
                                        className="flex-1 text-center text-xs font-bold text-white py-1.5 rounded-lg hover:opacity-90 transition"
                                        style={{ background: color }}>View</a>
                                      <a href={r.url} download
                                        className="flex-1 text-center text-xs font-bold text-gray-600 bg-gray-100 py-1.5 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1">
                                        <Download size={11} /> Save</a>
                                    </div>
                                  </>
                                ) : r?.error ? (
                                  <p className="text-xs text-red-500">{r.error}</p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          {/* end form column */}

          {/* ══════════════════════════════════════════════════════ */}
          {/*  RIGHT SIDEBAR — Journey Summary                       */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">

            {/* Journey card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <UserCheck size={16} /> Employee Journey
                </h3>
                <p className="text-gray-300 text-xs mt-0.5">
                  {emp.full_name ? <span className="font-semibold text-white">{emp.full_name}</span> : 'Select employee above'}
                </p>
              </div>
              <div className="p-4 space-y-3">

                {/* Step 1 */}
                <div className="rounded-xl border p-3" style={{ borderColor:'#3b82f640', background:'#3b82f608' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background:'#3b82f620' }}><Briefcase size={13} style={{ color:'#3b82f6' }} /></div>
                      <span className="text-xs font-bold text-gray-700">Step 1 · Joining</span>
                    </div>
                    {offerResult   ? <CheckCircle size={14} className="text-green-500" /> :
                     genOffer      ? <Loader size={13} className="animate-spin text-blue-400" /> : null}
                  </div>
                  {offerResult ? (
                    <div className="flex gap-1.5">
                      <a href={offerResult.url} target="_blank" rel="noreferrer"
                        className="flex-1 text-center text-xs font-semibold text-white py-1 rounded-lg"
                        style={{ background:'#3b82f6' }}>Offer Letter</a>
                      <a href={offerResult.url} download className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg hover:bg-gray-200 transition"><Download size={10} /></a>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">
                      {emp.date_of_joining ? `DOJ: ${emp.date_of_joining}` : 'Not generated yet'}
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border p-3" style={{ borderColor:'#0891b240', background:'#0891b208' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background:'#0891b220' }}><CreditCard size={13} style={{ color:'#0891b2' }} /></div>
                      <span className="text-xs font-bold text-gray-700">Step 2 · Payslips</span>
                    </div>
                    {psResults ? <CheckCircle size={14} className="text-green-500" /> :
                     genPs     ? <Loader size={13} className="animate-spin text-cyan-400" /> : null}
                  </div>
                  {psResults ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cyan-700 font-semibold">{psResults.generated}/{psResults.total} generated</span>
                      {psResults.zipUrl && (
                        <a href={psResults.zipUrl} download
                          className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-0.5 font-medium">
                          <Archive size={10} /> ZIP
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">
                      {psMonthRows.length > 0 ? `${psMonthRows.length} months selected` : 'No months selected'}
                    </div>
                  )}
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border p-3" style={{ borderColor:'#05996940', background:'#05996908' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background:'#05996920' }}><TrendingUp size={13} style={{ color:'#059969' }} /></div>
                      <span className="text-xs font-bold text-gray-700">Step 3 · Increments</span>
                    </div>
                    {incResults.length > 0 && incResults.every(r => r.success)
                      ? <CheckCircle size={14} className="text-green-500" />
                      : genInc
                        ? <Loader size={13} className="animate-spin text-emerald-400" />
                        : null}
                  </div>
                  {incResults.length > 0 ? (
                    <div className="space-y-1">
                      {incResults.map((r, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Increment {i + 1}
                            {r.success && r.newCtcVal && <span className="text-emerald-600 ml-1">→ ₹{inrFmt(r.newCtcVal)}</span>}
                          </span>
                          {r.success
                            ? <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5"><CheckCircle size={10} /> View</a>
                            : <span className="text-xs text-red-500">Failed</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">{incRows.length} row{incRows.length > 1 ? 's' : ''} configured</div>
                  )}
                </div>

                {/* Step 4 */}
                <div className="rounded-xl border p-3" style={{ borderColor:'#ef444440', background:'#ef444408' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background:'#ef444420' }}><LogOut size={13} style={{ color:'#ef4444' }} /></div>
                      <span className="text-xs font-bold text-gray-700">Step 4 · Exit</span>
                    </div>
                    {exitResults ? <CheckCircle size={14} className="text-green-500" /> :
                     genExit    ? <Loader size={13} className="animate-spin text-rose-400" /> : null}
                  </div>
                  {exitResults ? (
                    <div className="space-y-1">
                      {[
                        { key:'experience_letter', label:'Experience Letter' },
                        { key:'relieving_letter',  label:'Relieving Letter' },
                      ].map(({ key, label }) => {
                        const r = exitResults[key];
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{label}</span>
                            {r && !r.error
                              ? <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-rose-600 hover:underline flex items-center gap-0.5"><CheckCircle size={10} /> View</a>
                              : <span className="text-xs text-red-500">Failed</span>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">
                      {exit.relieving_date || exit.lwd_date ? `LWD: ${exit.lwd_date || exit.relieving_date}` : 'Not generated yet'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payslip batch mini-list */}
            {psMonthRows.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-cyan-100 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-teal-700 px-4 py-3">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <CreditCard size={15} /> Payslip Batch
                  </h3>
                  <p className="text-cyan-200 text-xs mt-0.5">{psMonthRows.length} months · ₹{inr2(psMonthRows.reduce((s,r)=>s+Number(r.net_pay||0),0))} total</p>
                </div>
                <div className="p-3 max-h-48 overflow-y-auto space-y-1">
                  {psMonthRows.map((r, i) => {
                    const res = psResults?.results?.[i];
                    return (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-medium text-gray-700">{r.pay_month} {r.pay_year}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-emerald-600 font-bold">₹{inr2(r.net_pay)}</span>
                          {res?.success && <CheckCircle size={11} className="text-green-500" />}
                          {res && !res.success && <AlertCircle size={11} className="text-red-500" />}
                          {genPs && !res && <Loader size={11} className="animate-spin text-cyan-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">💡 Tips</p>
              <ul className="text-xs text-amber-800 space-y-1.5">
                <li>• Select employee to auto-fill all fields</li>
                <li>• Enter Joining CTC first — increments cascade from it</li>
                <li>• Add multiple increment rows for long-tenure employees</li>
                <li>• Full Tenure payslips need Date of Joining</li>
                <li>• Relieving CTC = last increment CTC (update if needed)</li>
                <li>• Each phase has its own Generate button</li>
              </ul>
            </div>

          </div>
          {/* end sidebar */}

        </div>
      </div>
    </div>
  );
}
