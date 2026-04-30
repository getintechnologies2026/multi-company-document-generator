import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User, Briefcase, CreditCard, Building2, Mail, Phone,
  Calendar, Hash, MapPin, Save, ArrowLeft, Loader,
  CheckCircle, TrendingUp, Shield, Landmark, IdCard
} from 'lucide-react';
import api from '../services/api';

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

/* ── Salary input with ₹ ── */
function SalaryInput({ label, name, value, onChange, ring, color }) {
  return (
    <Field label={label} color={color}>
      <div className="relative">
        <span className={`absolute left-3 top-2.5 text-sm font-bold ${color} opacity-60`}>₹</span>
        <input type="number" step="0.01" name={name} value={value} onChange={onChange}
          placeholder="0.00"
          className={`w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm
            focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition placeholder:text-gray-300`} />
      </div>
    </Field>
  );
}

export default function EmployeeForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(initial);
  const [companies, setCompanies] = useState([]);
  const [saving, setSaving] = useState(false);

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
  const gross = ['basic','hra','da','conveyance','medical','special_allowance'].reduce((s,k) => s + Number(form[k]||0), 0);
  const ded   = ['pf','esi','professional_tax','tds'].reduce((s,k) => s + Number(form[k]||0), 0);
  const net   = gross - ded;
  const inr   = n => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });

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
          {/* Status badge */}
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
          title="Salary Structure" subtitle="CTC, earnings and deduction breakdown"
          light="bg-amber-50" border="border-amber-100">
          {/* Earnings */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-amber-200"></div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">Earnings</span>
              <div className="h-px flex-1 bg-amber-200"></div>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-4">
                <SalaryInput label="Annual CTC" name="ctc" value={form.ctc} onChange={oc} ring="focus:ring-amber-400" color="text-amber-700" />
              </div>
              {[['basic','Basic'],['hra','HRA'],['da','DA'],['conveyance','Conveyance'],['medical','Medical'],['special_allowance','Special Allowance']].map(([n,l]) => (
                <SalaryInput key={n} label={l} name={n} value={form[n]} onChange={oc} ring="focus:ring-amber-400" color="text-amber-700" />
              ))}
            </div>
          </div>
          {/* Deductions */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-amber-200"></div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">Deductions</span>
              <div className="h-px flex-1 bg-amber-200"></div>
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              {[['pf','PF'],['esi','ESI'],['professional_tax','Prof. Tax'],['tds','TDS']].map(([n,l]) => (
                <SalaryInput key={n} label={l} name={n} value={form[n]} onChange={oc} ring="focus:ring-red-300" color="text-red-500" />
              ))}
            </div>
          </div>
          {/* Live Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-500 text-white rounded-2xl p-4 text-center shadow">
              <div className="text-xs font-medium opacity-80 mb-1">Gross Earnings</div>
              <div className="text-lg font-bold">₹{inr(gross)}</div>
            </div>
            <div className="bg-red-500 text-white rounded-2xl p-4 text-center shadow">
              <div className="text-xs font-medium opacity-80 mb-1">Total Deductions</div>
              <div className="text-lg font-bold">₹{inr(ded)}</div>
            </div>
            <div className="bg-blue-600 text-white rounded-2xl p-4 text-center shadow">
              <div className="text-xs font-medium opacity-80 mb-1">Monthly Net Pay</div>
              <div className="text-lg font-bold">₹{inr(net)}</div>
            </div>
          </div>
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
        <Section gradient="from-rose-500 to-pink-700" icon={IdCard}
          title="Government IDs & PF Details" subtitle="PAN, Aadhaar, UAN and PF number"
          light="bg-rose-50" border="border-rose-100">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="PAN Number" color="text-rose-700">
              <SInput ring="focus:ring-rose-400" icon={IdCard} name="pan" value={form.pan} onChange={oc} placeholder="ABCDE1234F" />
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
              { label: 'Name',        value: form.full_name || '—',        color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Designation', value: form.designation || '—',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'Department',  value: form.department || '—',       color: 'bg-violet-50 text-violet-700 border-violet-200' },
              { label: 'Net Pay/mo',  value: net > 0 ? `₹${inr(net)}` : '—', color: 'bg-amber-50 text-amber-700 border-amber-200' },
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
