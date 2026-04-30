import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileDown, CheckCircle, AlertCircle, Loader,
  User, Building2, CreditCard, FileText, Award, LogOut,
  ChevronDown, ChevronUp, Sparkles, Download
} from 'lucide-react';
import api from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DOC_META = {
  offer_letter:      { label: 'Offer Letter',      icon: FileText, color: '#3b82f6' },
  payslip:           { label: 'Payslip',            icon: CreditCard, color: '#10b981' },
  experience_letter: { label: 'Experience Letter',  icon: Award, color: '#f59e0b' },
  relieving_letter:  { label: 'Relieving Letter',   icon: LogOut, color: '#ef4444' }
};

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
  const [open, setOpen] = useState({ company: true, employee: true, salary: true, payslip: true, offer: true, other: true });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);

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

  useEffect(() => {
    const gross = ['basic','hra','da','conveyance','medical','special_allowance']
      .reduce((s,k) => s + Number(salary[k]||0), 0);
    const ded = ['pf','esi','professional_tax','tds']
      .reduce((s,k) => s + Number(salary[k]||0), 0);
    setPayslip(p => ({ ...p, gross_earnings: gross.toFixed(2), total_deductions: ded.toFixed(2), net_pay: (gross - ded).toFixed(2) }));
  }, [salary]);

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

  const generateAll = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!emp.full_name) return toast.error('Employee name is required');
    setGenerating(true); setResults(null);
    try {
      const { data } = await api.post('/documents/generate-all', {
        company_id: companyId, employee_id: employeeId || null,
        employee: { ...emp, ...salary }, payslip, offer, experience, relieving
      });
      setResults(data.documents);
      toast.success('All 4 documents generated!');
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
            <p className="text-blue-100 text-sm mt-1">Fill once → Offer Letter + Payslip + Experience + Relieving in one click</p>
          </div>
          <button onClick={generateAll} disabled={generating}
            className="flex items-center gap-2 bg-white text-brand-800 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-60 text-sm">
            {generating ? <Loader size={18} className="animate-spin text-brand-700" /> : <FileDown size={18} />}
            {generating ? 'Generating...' : 'Generate All 4 Documents'}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0">
              {Object.entries(DOC_META).map(([key, { label, icon: Icon, color }]) => {
                const r = results[key];
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
                    ) : (
                      <div className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {r?.error || 'Failed'}</div>
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

            {/* SECTION 4 – Payslip */}
            {(() => { const sec = SECTIONS[3]; return (
              <div key={sec.id} className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
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
                      <Field label="Working Days" color={sec.text}>
                        <SInput ring={sec.ring} type="number" name="working_days" value={payslip.working_days} onChange={ch(setPayslip)} />
                      </Field>
                      <Field label="Paid Days" color={sec.text}>
                        <SInput ring={sec.ring} type="number" name="paid_days" value={payslip.paid_days} onChange={ch(setPayslip)} />
                      </Field>
                      <Field label="LOP Days" color={sec.text}>
                        <SInput ring={sec.ring} type="number" name="lop_days" value={payslip.lop_days} onChange={ch(setPayslip)} />
                      </Field>
                    </div>
                    {/* Auto-calculated summary */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Gross Earnings', val: payslip.gross_earnings, bg: 'bg-green-500', name: 'gross_earnings' },
                        { label: 'Total Deductions', val: payslip.total_deductions, bg: 'bg-red-500', name: 'total_deductions' },
                        { label: 'Net Pay', val: payslip.net_pay, bg: 'bg-blue-600', name: 'net_pay' }
                      ].map(({ label, val, bg, name }) => (
                        <div key={name} className={`${bg} text-white rounded-xl p-3 text-center`}>
                          <div className="text-xs font-medium opacity-80 mb-1">{label} (auto)</div>
                          <div className="text-lg font-bold">₹{Number(val||0).toLocaleString('en-IN')}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Field label="Amount in Words" color={sec.text}>
                        <SInput ring={sec.ring} name="amount_in_words" value={payslip.amount_in_words} onChange={ch(setPayslip)} placeholder="Rupees Twenty Five Thousand Only" />
                      </Field>
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

            {/* Bottom Generate Button */}
            <button onClick={generateAll} disabled={generating}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg shadow-xl transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed, #db2777)', color: 'white' }}>
              {generating ? <Loader size={22} className="animate-spin" /> : <FileDown size={22} />}
              {generating ? 'Generating All Documents...' : 'Generate All 4 Documents'}
            </button>
          </div>

          {/* RIGHT PANEL – Document Status */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <FileText size={16} /> Document Output
                </h3>
                <p className="text-gray-300 text-xs mt-0.5">4 documents will be generated</p>
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
                        <div className="text-xs text-gray-400 italic">Waiting to generate...</div>
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

            {/* Tips card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">Tips</p>
              <ul className="text-xs text-amber-800 space-y-1.5">
                <li>• Select an employee to auto-fill all fields</li>
                <li>• Salary → Payslip totals are auto-calculated</li>
                <li>• All sections are optional except Employee Name</li>
                <li>• PDFs include company logo & signature</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
