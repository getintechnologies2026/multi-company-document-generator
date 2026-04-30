import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User, Briefcase, CreditCard, Building2, Mail, Phone,
  Calendar, Hash, MapPin, Save, ArrowLeft, Loader,
  CheckCircle, TrendingUp, Shield, Landmark, Contact2,
  Zap, RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import api from '../services/api';

/* ── Salary Templates ── */
const TEMPLATES = {
  standard: {
    label: 'Standard',
    desc: 'Basic 40%',
    color: 'from-amber-400 to-orange-500',
    basicPct: 40,
    hraPct: 40,   // % of Basic
    daPct: 0,
    conveyance: 1600,
    medical: 1250,
  },
  senior: {
    label: 'Senior',
    desc: 'Basic 45%',
    color: 'from-orange-400 to-red-500',
    basicPct: 45,
    hraPct: 40,
    daPct: 0,
    conveyance: 1600,
    medical: 1250,
  },
  executive: {
    label: 'Executive',
    desc: 'Basic 50%',
    color: 'from-violet-500 to-purple-600',
    basicPct: 50,
    hraPct: 50,
    daPct: 0,
    conveyance: 2000,
    medical: 1250,
  },
};

/* ── CTC Breakdown Calculator ── */
function calcBreakdown(annualCtc, tpl) {
  const monthly = Math.round(annualCtc / 12);
  const basic   = Math.round(monthly * tpl.basicPct / 100);
  const hra     = Math.round(basic   * tpl.hraPct   / 100);
  const da      = Math.round(basic   * tpl.daPct    / 100);
  const conv    = tpl.conveyance;
  const med     = tpl.medical;
  const special = Math.max(0, monthly - basic - hra - da - conv - med);
  const pf      = Math.round(basic * 0.12);
  const esi     = monthly <= 21000 ? Math.round(monthly * 0.0075) : 0;
  return { basic, hra, da, conveyance: conv, medical: med, special_allowance: special, pf, esi };
}

const initial = {
  company_id: '', emp_code: '', full_name: '', father_name: '', dob: '', gender: '',
  email: '', phone: '', address: '',
  designation: '', department: '', date_of_joining: '', date_of_leaving: '',
  employment_type: 'Full-Time', status: 'Active',
  ctc: '', basic: '', hra: '', da: '', conveyance: '', medical: '', special_allowance: '',
  pf: '', esi: '', professional_tax: '', tds: '',
  bank_name: '', bank_account: '', ifsc_code: '', pan: '', aadhaar: '', uan: '', pf_no: ''
};

const fmt = d => d ? d.split('T')[0] : '';
const inr = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

/* ── Field wrapper ── */
function Field({ label, color = 'text-gray-500', required, children }) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Styled Input ── */
function SInput({ ring = 'focus:ring-blue-400', icon: Icon, prefix, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />}
      {prefix && <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold pointer-events-none">{prefix}</span>}
      <input
        {...props}
        className={`w-full ${Icon || prefix ? 'pl-8' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
          bg-white shadow-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent
          transition placeholder:text-gray-300 ${props.className || ''}`}
      />
    </div>
  );
}

/* ── Styled Select ── */
function SSelect({ ring = 'focus:ring-blue-400', children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm
        focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition`}
    >
      {children}
    </select>
  );
}

/* ── Section card ── */
function Section({ gradient, icon: Icon, title, subtitle, children, light, border }) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center gap-3`}>
        <div className="bg-white/20 p-2 rounded-xl"><Icon size={18} className="text-white" /></div>
        <div>
          <div className="text-white font-bold">{title}</div>
          <div className="text-white/70 text-xs">{subtitle}</div>
        </div>
      </div>
      <div className={`${light} p-5 border-t ${border}`}>{children}</div>
    </div>
  );
}

/* ── CTC Row in breakdown table ── */
function CtcRow({ label, badge, amount, pct, pctLabel, editable, onAmtChange, onPctChange, amtRing = 'focus:ring-amber-300', highlight }) {
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-xl transition ${highlight ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {badge && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {pct !== undefined && (
        <div className="w-24 flex items-center gap-1">
          <input
            type="number" value={pct} onChange={onPctChange}
            disabled={!editable}
            className={`w-16 px-2 py-1.5 text-xs border rounded-lg text-center font-bold
              ${editable ? 'border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400' : 'border-gray-200 bg-gray-50 text-gray-400'}`}
          />
          <span className="text-xs text-gray-400">{pctLabel || '%'}</span>
        </div>
      )}
      <div className="relative w-32">
        <span className="absolute left-2.5 top-2 text-xs font-bold text-amber-600">₹</span>
        <input
          type="number" value={amount} onChange={onAmtChange}
          disabled={!editable}
          className={`w-full pl-6 pr-2 py-1.5 text-sm font-semibold border rounded-lg text-right
            ${editable ? `border-amber-300 bg-white focus:outline-none focus:ring-1 ${amtRing}` : 'border-gray-200 bg-gray-50 text-gray-500'}`}
        />
      </div>
    </div>
  );
}

export default function EmployeeForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(initial);
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTpl, setActiveTpl] = useState('standard');
  const [tplConfig, setTplConfig] = useState({ ...TEMPLATES.standard });
  const [showTplDetails, setShowTplDetails] = useState(false);

  useEffect(() => {
    api.get('/companies').then(({ data }) => setCompanies(data));
    if (id) api.get(`/employees/${id}`).then(({ data }) => setForm({
      ...initial, ...data,
      dob: fmt(data.dob),
      date_of_joining: fmt(data.date_of_joining),
      date_of_leaving: fmt(data.date_of_leaving)
    }));
  }, [id]);

  const oc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Apply CTC Breakdown ── */
  const applyCtc = useCallback((ctcVal, tpl) => {
    const annual = Number(ctcVal);
    if (!annual || annual <= 0) return;
    const b = calcBreakdown(annual, tpl);
    setForm(f => ({
      ...f,
      ctc: ctcVal,
      basic: b.basic,
      hra: b.hra,
      da: b.da,
      conveyance: b.conveyance,
      medical: b.medical,
      special_allowance: b.special_allowance,
      pf: b.pf,
      esi: b.esi,
    }));
  }, []);

  const handleCtcChange = e => {
    const val = e.target.value;
    setForm(f => ({ ...f, ctc: val }));
    if (val) applyCtc(val, tplConfig);
  };

  const handleSelectTemplate = (key) => {
    setActiveTpl(key);
    const tpl = { ...TEMPLATES[key] };
    setTplConfig(tpl);
    if (form.ctc) applyCtc(form.ctc, tpl);
  };

  const handleTplPctChange = (field, val) => {
    const updated = { ...tplConfig, [field]: Number(val) };
    setTplConfig(updated);
    setActiveTpl('custom');
    if (form.ctc) applyCtc(form.ctc, updated);
  };

  /* ── Recalculate special allowance when individual component changes ── */
  const handleEarningChange = e => {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      const monthly = Math.round(Number(f.ctc || 0) / 12);
      if (monthly > 0 && name !== 'special_allowance') {
        const used = ['basic','hra','da','conveyance','medical']
          .reduce((s, k) => s + Number(k === name ? value : updated[k] || 0), 0);
        updated.special_allowance = Math.max(0, monthly - used);
      }
      if (name === 'basic') {
        updated.pf = Math.round(Number(value) * 0.12);
      }
      return updated;
    });
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.company_id) return toast.error('Please select a company');
    if (!form.full_name.trim()) return toast.error('Full name is required');
    setSaving(true);
    try {
      if (id) await api.put(`/employees/${id}`, form);
      else await api.post('/employees', form);
      toast.success(id ? 'Employee updated!' : 'Employee created!');
      nav('/employees');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Live salary summary
  const gross   = ['basic','hra','da','conveyance','medical','special_allowance'].reduce((s,k) => s + Number(form[k]||0), 0);
  const ded     = ['pf','esi','professional_tax','tds'].reduce((s,k) => s + Number(form[k]||0), 0);
  const net     = gross - ded;
  const monthly = Math.round(Number(form.ctc || 0) / 12);

  const statusColors = { Active: 'bg-green-100 text-green-700', Resigned: 'bg-amber-100 text-amber-700', Terminated: 'bg-red-100 text-red-700' };

  return (
    <div className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white px-6 py-6 shadow-lg mb-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl"><User size={22} className="text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold">{id ? 'Edit Employee' : 'Add New Employee'}</h1>
              <p className="text-blue-200 text-sm">Fill all sections for complete employee profile</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => nav('/employees')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={submit} disabled={saving}
              className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow transition disabled:opacity-60">
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-5xl mx-auto px-4 space-y-5">

        {/* ── SECTION 1: Company & Identity ── */}
        <Section gradient="from-blue-500 to-blue-700" icon={Building2}
          title="Company & Identity" subtitle="Which company and basic identification"
          light="bg-blue-50" border="border-blue-100">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="Company" color="text-blue-700" required>
                <SSelect ring="focus:ring-blue-400" name="company_id" value={form.company_id} onChange={oc} required>
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SSelect>
              </Field>
            </div>
            <Field label="Employee Code" color="text-blue-700">
              <SInput ring="focus:ring-blue-400" icon={Hash} name="emp_code" value={form.emp_code} onChange={oc} placeholder="EMP001" />
            </Field>
          </div>
        </Section>

        {/* ── SECTION 2: Personal Info ── */}
        <Section gradient="from-violet-500 to-purple-700" icon={User}
          title="Personal Information" subtitle="Name, contact and personal details"
          light="bg-violet-50" border="border-violet-100">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="Full Name" color="text-violet-700" required>
                <SInput ring="focus:ring-violet-400" icon={User} name="full_name" value={form.full_name} onChange={oc} placeholder="Rajesh Kumar" required />
              </Field>
            </div>
            <Field label="Father / Husband Name" color="text-violet-700">
              <SInput ring="focus:ring-violet-400" name="father_name" value={form.father_name} onChange={oc} placeholder="Suresh Kumar" />
            </Field>
            <Field label="Date of Birth" color="text-violet-700">
              <SInput ring="focus:ring-violet-400" icon={Calendar} type="date" name="dob" value={form.dob} onChange={oc} />
            </Field>
            <Field label="Gender" color="text-violet-700">
              <SSelect ring="focus:ring-violet-400" name="gender" value={form.gender} onChange={oc}>
                <option value="">Select Gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </SSelect>
            </Field>
            <Field label="Email Address" color="text-violet-700">
              <SInput ring="focus:ring-violet-400" icon={Mail} type="email" name="email" value={form.email} onChange={oc} placeholder="rajesh@email.com" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Phone Number" color="text-violet-700">
                <SInput ring="focus:ring-violet-400" icon={Phone} name="phone" value={form.phone} onChange={oc} placeholder="+91-98765 43210" />
              </Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Residential Address" color="text-violet-700">
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-3 text-gray-400" />
                  <textarea name="address" value={form.address} onChange={oc} rows={2}
                    placeholder="House No, Street, Area, City..."
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition resize-none placeholder:text-gray-300" />
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* ── SECTION 3: Job Details ── */}
        <Section gradient="from-emerald-500 to-teal-700" icon={Briefcase}
          title="Job Details" subtitle="Role, department, dates and employment type"
          light="bg-emerald-50" border="border-emerald-100">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Designation" color="text-emerald-700">
              <SInput ring="focus:ring-emerald-400" icon={Briefcase} name="designation" value={form.designation} onChange={oc} placeholder="Software Engineer" />
            </Field>
            <Field label="Department" color="text-emerald-700">
              <SInput ring="focus:ring-emerald-400" name="department" value={form.department} onChange={oc} placeholder="Technology" />
            </Field>
            <Field label="Employment Type" color="text-emerald-700">
              <SSelect ring="focus:ring-emerald-400" name="employment_type" value={form.employment_type} onChange={oc}>
                <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Intern</option>
              </SSelect>
            </Field>
            <Field label="Date of Joining" color="text-emerald-700">
              <SInput ring="focus:ring-emerald-400" icon={Calendar} type="date" name="date_of_joining" value={form.date_of_joining} onChange={oc} />
            </Field>
            <Field label="Date of Leaving" color="text-emerald-700">
              <SInput ring="focus:ring-emerald-400" icon={Calendar} type="date" name="date_of_leaving" value={form.date_of_leaving} onChange={oc} />
            </Field>
            <Field label="Status" color="text-emerald-700">
              <SSelect ring="focus:ring-emerald-400" name="status" value={form.status} onChange={oc}>
                <option>Active</option><option>Resigned</option><option>Terminated</option>
              </SSelect>
            </Field>
          </div>
          {form.status && (
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              <span className="text-xs text-emerald-700">Current Status:</span>
              <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${statusColors[form.status]}`}>{form.status}</span>
            </div>
          )}
        </Section>

        {/* ── SECTION 4: Salary Structure ── */}
        <Section gradient="from-amber-500 to-orange-600" icon={TrendingUp}
          title="Salary Structure" subtitle="Enter Annual CTC — monthly breakdown auto-calculated"
          light="bg-amber-50" border="border-amber-100">

          {/* ── Annual CTC Input ── */}
          <div className="mb-5">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-amber-500 p-2 rounded-xl"><Zap size={16} className="text-white" /></div>
                <div>
                  <p className="font-bold text-amber-800 text-sm">Annual CTC → Monthly Breakdown</p>
                  <p className="text-amber-600 text-xs">Enter Annual CTC and select a template to auto-fill all salary components</p>
                </div>
              </div>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5">Annual CTC (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-amber-600 font-bold text-sm">₹</span>
                    <input
                      type="number" name="ctc" value={form.ctc} onChange={handleCtcChange}
                      placeholder="e.g. 600000"
                      className="w-full pl-8 pr-3 py-2.5 border-2 border-amber-300 rounded-xl text-sm bg-white font-semibold
                        focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition shadow-sm"
                    />
                  </div>
                </div>
                {form.ctc > 0 && (
                  <div className="bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-center shadow-sm min-w-36">
                    <p className="text-xs text-amber-600 font-medium">Monthly CTC</p>
                    <p className="text-lg font-bold text-amber-700">₹{inr(monthly)}</p>
                    <p className="text-xs text-gray-400">per month</p>
                  </div>
                )}
                {form.ctc > 0 && (
                  <button type="button" onClick={() => applyCtc(form.ctc, tplConfig)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow transition">
                    <RefreshCw size={14} /> Recalculate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Template Selector ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Salary Template</p>
              <button type="button" onClick={() => setShowTplDetails(v => !v)}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-medium transition">
                {showTplDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showTplDetails ? 'Hide details' : 'Customize %'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button key={key} type="button" onClick={() => handleSelectTemplate(key)}
                  className={`relative rounded-xl p-3 border-2 transition text-left
                    ${activeTpl === key
                      ? 'border-amber-500 bg-gradient-to-br ' + tpl.color + ' text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-amber-300 text-gray-700'}`}>
                  {activeTpl === key && <CheckCircle size={14} className="absolute top-2 right-2 text-white opacity-80" />}
                  <p className="font-bold text-sm">{tpl.label}</p>
                  <p className={`text-xs mt-0.5 ${activeTpl === key ? 'text-white/80' : 'text-gray-500'}`}>{tpl.desc}</p>
                  <p className={`text-xs mt-1 ${activeTpl === key ? 'text-white/70' : 'text-gray-400'}`}>
                    HRA {tpl.hraPct}% of Basic
                  </p>
                </button>
              ))}
            </div>

            {/* ── Customise Percentages ── */}
            {showTplDetails && (
              <div className="bg-white border border-amber-200 rounded-xl p-4 mt-2">
                <p className="text-xs font-bold text-amber-700 mb-3 flex items-center gap-1.5">
                  <Info size={13} /> Adjust percentages — changes will recalculate the breakdown
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'basicPct', label: 'Basic % of Monthly CTC' },
                    { key: 'hraPct',   label: 'HRA % of Basic' },
                    { key: 'daPct',    label: 'DA % of Basic' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <div className="relative">
                        <input type="number" value={tplConfig[key]}
                          onChange={e => handleTplPctChange(key, e.target.value)}
                          className="w-full pr-6 pl-3 py-2 border border-amber-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400" />
                        <span className="absolute right-2.5 top-2.5 text-xs text-gray-400">%</span>
                      </div>
                    </div>
                  ))}
                  {[
                    { key: 'conveyance', label: 'Conveyance (₹ fixed)' },
                    { key: 'medical',    label: 'Medical (₹ fixed)' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs font-bold text-amber-600">₹</span>
                        <input type="number" value={tplConfig[key]}
                          onChange={e => handleTplPctChange(key, e.target.value)}
                          className="w-full pl-6 pr-2 py-2 border border-amber-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Earnings Breakdown Table ── */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-amber-200"></div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
                Monthly Earnings Breakdown
              </span>
              <div className="h-px flex-1 bg-amber-200"></div>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
              <div className="flex-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Component</div>
              <div className="w-24 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Rate</div>
              <div className="w-32 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Monthly (₹)</div>
            </div>

            <div className="space-y-1 bg-white rounded-xl border border-amber-100 p-2 shadow-sm">
              {/* Basic */}
              <CtcRow label="Basic Salary" badge={`${tplConfig.basicPct}% of CTC`}
                pct={tplConfig.basicPct} pctLabel="% CTC" editable
                onPctChange={e => handleTplPctChange('basicPct', e.target.value)}
                amount={form.basic}
                onAmtChange={e => handleEarningChange({ target: { name: 'basic', value: e.target.value } })}
                highlight />
              {/* HRA */}
              <CtcRow label="HRA" badge={`${tplConfig.hraPct}% of Basic`}
                pct={tplConfig.hraPct} pctLabel="% Bas" editable
                onPctChange={e => handleTplPctChange('hraPct', e.target.value)}
                amount={form.hra}
                onAmtChange={e => handleEarningChange({ target: { name: 'hra', value: e.target.value } })} />
              {/* DA */}
              <CtcRow label="Dearness Allowance (DA)" badge={`${tplConfig.daPct}% of Basic`}
                pct={tplConfig.daPct} pctLabel="% Bas" editable
                onPctChange={e => handleTplPctChange('daPct', e.target.value)}
                amount={form.da}
                onAmtChange={e => handleEarningChange({ target: { name: 'da', value: e.target.value } })} />
              {/* Conveyance */}
              <CtcRow label="Conveyance Allowance" badge="Fixed"
                amount={form.conveyance} editable
                onAmtChange={e => handleEarningChange({ target: { name: 'conveyance', value: e.target.value } })} />
              {/* Medical */}
              <CtcRow label="Medical Allowance" badge="Fixed"
                amount={form.medical} editable
                onAmtChange={e => handleEarningChange({ target: { name: 'medical', value: e.target.value } })} />
              {/* Special */}
              <CtcRow label="Special Allowance" badge="Balance"
                amount={form.special_allowance}
                onAmtChange={e => oc({ target: { name: 'special_allowance', value: e.target.value } })}
                editable amtRing="focus:ring-orange-300" />

              {/* Gross Total */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
                <div className="flex-1 text-sm font-bold text-emerald-700">Gross Monthly Salary</div>
                <div className="text-base font-bold text-emerald-700">₹{inr(gross)}</div>
              </div>
            </div>
          </div>

          {/* ── Deductions Breakdown ── */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-amber-200"></div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">
                Monthly Deductions
              </span>
              <div className="h-px flex-1 bg-amber-200"></div>
            </div>

            <div className="space-y-1 bg-white rounded-xl border border-red-100 p-2 shadow-sm">
              {/* PF */}
              <CtcRow label="Provident Fund (PF)" badge="12% of Basic — Auto"
                amount={form.pf} editable
                onAmtChange={e => oc({ target: { name: 'pf', value: e.target.value } })}
                amtRing="focus:ring-red-300" />
              {/* ESI */}
              <CtcRow label="ESI" badge={gross <= 21000 ? '0.75% of Gross — Auto' : 'Not applicable (Gross > ₹21,000)'}
                amount={form.esi} editable
                onAmtChange={e => oc({ target: { name: 'esi', value: e.target.value } })}
                amtRing="focus:ring-red-300" />
              {/* Prof Tax */}
              <CtcRow label="Professional Tax" badge="State-wise slab"
                amount={form.professional_tax} editable
                onAmtChange={e => oc({ target: { name: 'professional_tax', value: e.target.value } })}
                amtRing="focus:ring-red-300" />
              {/* TDS */}
              <CtcRow label="TDS (Income Tax)" badge="As applicable"
                amount={form.tds} editable
                onAmtChange={e => oc({ target: { name: 'tds', value: e.target.value } })}
                amtRing="focus:ring-red-300" />

              {/* Deduction Total */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl mt-2">
                <div className="flex-1 text-sm font-bold text-red-600">Total Deductions</div>
                <div className="text-base font-bold text-red-600">₹{inr(ded)}</div>
              </div>
            </div>
          </div>

          {/* ── Net Pay Summary Cards ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-4 text-center shadow-md">
              <div className="text-xs font-medium opacity-80 mb-1">Gross Earnings</div>
              <div className="text-xl font-bold">₹{inr(gross)}</div>
              <div className="text-xs opacity-70 mt-0.5">per month</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-4 text-center shadow-md">
              <div className="text-xs font-medium opacity-80 mb-1">Total Deductions</div>
              <div className="text-xl font-bold">₹{inr(ded)}</div>
              <div className="text-xs opacity-70 mt-0.5">per month</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 text-center shadow-md">
              <div className="text-xs font-medium opacity-80 mb-1">Monthly Net Pay</div>
              <div className="text-xl font-bold">₹{inr(net)}</div>
              <div className="text-xs opacity-70 mt-0.5">take-home</div>
            </div>
          </div>

          {/* Annual summary */}
          {net > 0 && (
            <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700">
                <Info size={14} />
                <span className="text-xs font-semibold">Annual Net Pay (Take-home)</span>
              </div>
              <span className="text-sm font-bold text-indigo-700">₹{inr(net * 12)} / year</span>
            </div>
          )}
        </Section>

        {/* ── SECTION 5: Bank Details ── */}
        <Section gradient="from-cyan-500 to-blue-600" icon={Landmark}
          title="Bank Details" subtitle="Account number, IFSC and bank name"
          light="bg-cyan-50" border="border-cyan-100">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Bank Name" color="text-cyan-700">
              <SInput ring="focus:ring-cyan-400" icon={Landmark} name="bank_name" value={form.bank_name} onChange={oc} placeholder="HDFC Bank" />
            </Field>
            <Field label="Account Number" color="text-cyan-700">
              <SInput ring="focus:ring-cyan-400" icon={Hash} name="bank_account" value={form.bank_account} onChange={oc} placeholder="XXXX XXXX XXXX" />
            </Field>
            <Field label="IFSC Code" color="text-cyan-700">
              <SInput ring="focus:ring-cyan-400" name="ifsc_code" value={form.ifsc_code} onChange={oc} placeholder="HDFC0001234" />
            </Field>
          </div>
        </Section>

        {/* ── SECTION 6: Government IDs ── */}
        <Section gradient="from-rose-500 to-pink-700" icon={Contact2}
          title="Government IDs & PF Details" subtitle="PAN, Aadhaar, UAN and PF number"
          light="bg-rose-50" border="border-rose-100">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="PAN Number" color="text-rose-700">
              <SInput ring="focus:ring-rose-400" icon={Contact2} name="pan" value={form.pan} onChange={oc} placeholder="ABCDE1234F" />
            </Field>
            <Field label="Aadhaar Number" color="text-rose-700">
              <SInput ring="focus:ring-rose-400" icon={Shield} name="aadhaar" value={form.aadhaar} onChange={oc} placeholder="XXXX XXXX XXXX" />
            </Field>
            <Field label="UAN (Universal Account Number)" color="text-rose-700">
              <SInput ring="focus:ring-rose-400" icon={Hash} name="uan" value={form.uan} onChange={oc} placeholder="100XXXXXXXXX" />
            </Field>
            <Field label="PF Number" color="text-rose-700">
              <SInput ring="focus:ring-rose-400" icon={Hash} name="pf_no" value={form.pf_no} onChange={oc} placeholder="MH/BAN/000000/000" />
            </Field>
          </div>
          <div className="mt-4 bg-rose-100 border border-rose-200 rounded-xl p-3">
            <p className="text-xs text-rose-700">
              <span className="font-bold">Note:</span> PAN and Aadhaar are printed on payslips. UAN and PF number appear in the payslip statutory section.
            </p>
          </div>
        </Section>

        {/* ── Profile Summary Card ── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Profile Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Name',        value: form.full_name || '—',            color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Designation', value: form.designation || '—',          color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Annual CTC',  value: form.ctc ? `₹${inr(form.ctc)}` : '—', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Net Pay/mo',  value: net > 0 ? `₹${inr(net)}` : '—',  color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} border rounded-xl p-3`}>
                <p className="text-xs font-bold uppercase tracking-wide opacity-60 mb-1">{label}</p>
                <p className="text-xs font-semibold truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white shadow-lg transition disabled:opacity-60 text-base"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5, #7c3aed)' }}>
            {saving ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : id ? 'Update Employee' : 'Create Employee'}
          </button>
          <button type="button" onClick={() => nav('/employees')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow transition">
            <ArrowLeft size={18} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
