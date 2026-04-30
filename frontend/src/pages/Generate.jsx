import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileDown, FileText, CreditCard, Award, LogOut, Sparkles, Loader, CheckCircle, Download, TrendingUp, ArrowUpCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const inrFmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

const TYPES = [
  { id: 'offer_letter',      label: 'Offer Letter',      icon: Sparkles,    gradient: 'from-orange-400 to-amber-600',  ring: 'ring-orange-400' },
  { id: 'payslip',           label: 'Payslip',            icon: CreditCard,  gradient: 'from-emerald-400 to-green-600', ring: 'ring-emerald-400' },
  { id: 'experience_letter', label: 'Experience Letter',  icon: Award,       gradient: 'from-violet-400 to-purple-600', ring: 'ring-violet-400' },
  { id: 'relieving_letter',  label: 'Relieving Letter',   icon: LogOut,      gradient: 'from-rose-400 to-red-600',      ring: 'ring-rose-400' },
  { id: 'salary_increment',  label: 'Increment Letter',   icon: TrendingUp,  gradient: 'from-teal-400 to-teal-600',    ring: 'ring-teal-400' },
];

const TYPE_COLORS = {
  offer_letter:      { light: 'bg-orange-50',  border: 'border-orange-200', text: 'text-orange-700', ring: 'focus:ring-orange-400', gradient: 'from-orange-500 to-amber-600' },
  payslip:           { light: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-700',ring: 'focus:ring-emerald-400',gradient: 'from-emerald-500 to-green-600' },
  experience_letter: { light: 'bg-violet-50',  border: 'border-violet-200', text: 'text-violet-700', ring: 'focus:ring-violet-400', gradient: 'from-violet-500 to-purple-600' },
  relieving_letter:  { light: 'bg-rose-50',    border: 'border-rose-200',   text: 'text-rose-700',   ring: 'focus:ring-rose-400',   gradient: 'from-rose-500 to-red-600' },
  salary_increment:  { light: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-700',   ring: 'focus:ring-teal-400',   gradient: 'from-teal-500 to-teal-700' },
};

function Field({ label, color = 'text-gray-600', children }) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>{label}</label>
      {children}
    </div>
  );
}

export default function Generate() {
  const { type } = useParams();
  const nav = useNavigate();
  const [docType, setDocType] = useState(type || 'offer_letter');
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [data, setData] = useState({});
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const C = TYPE_COLORS[docType];

  useEffect(() => { api.get('/companies').then(({ data }) => setCompanies(data)); }, []);
  useEffect(() => {
    if (companyId) api.get('/employees', { params: { company_id: companyId } }).then(({ data }) => setEmployees(data));
    else setEmployees([]);
    setEmployeeId('');
  }, [companyId]);
  useEffect(() => { if (type) setDocType(type); }, [type]);

  // Auto-fill salary for payslip
  useEffect(() => {
    if (docType !== 'payslip' || !employeeId) return;
    const emp = employees.find(e => e.id == employeeId);
    if (!emp) return;
    const gross = ['basic','hra','da','conveyance','medical','special_allowance'].reduce((s,k) => s + Number(emp[k]||0), 0);
    const ded   = ['pf','esi','professional_tax','tds'].reduce((s,k) => s + Number(emp[k]||0), 0);
    setData(d => ({ ...d, gross_earnings: gross.toFixed(2), total_deductions: ded.toFixed(2), net_pay: (gross-ded).toFixed(2), working_days: d.working_days||30, paid_days: d.paid_days||30 }));
  }, [docType, employeeId, employees]);

  const od = (e) => setData(d => ({ ...d, [e.target.name]: e.target.value }));

  // Live increment preview
  const selEmp = employees.find(e => e.id == employeeId);
  const curCtc  = Number(selEmp?.ctc || 0);
  const incVal  = Number(data.increment_value || 0);
  const newCtc  = data.increment_type === 'flat'
    ? curCtc + Math.round(incVal * 12)
    : Math.round(curCtc * (1 + incVal / 100));
  const incAmt  = newCtc - curCtc;

  const submit = async (e) => {
    e.preventDefault();
    if (!companyId) return toast.error('Select a company');
    // Validate before setting generating=true to avoid stuck button
    if (docType === 'salary_increment') {
      if (!data.increment_value) return toast.error('Enter increment value');
      if (!data.increment_date)  return toast.error('Select effective date');
    }
    setGenerating(true); setResult(null);
    try {
      let res;
      if (docType === 'salary_increment') {
        const empData = selEmp ? {
          full_name: selEmp.full_name, designation: selEmp.designation, department: selEmp.department,
          emp_code: selEmp.emp_code, ctc: selEmp.ctc, basic: selEmp.basic, hra: selEmp.hra,
          da: selEmp.da, conveyance: selEmp.conveyance, medical: selEmp.medical,
          special_allowance: selEmp.special_allowance, pf: selEmp.pf, esi: selEmp.esi,
        } : {};
        const { data: r } = await api.post('/documents/generate-salary-increment', {
          company_id: companyId, employee_id: employeeId || null,
          employee: empData,
          increment: {
            increment_date:  data.increment_date,
            increment_type:  data.increment_type || 'percentage',
            increment_value: data.increment_value,
          }
        });
        res = r;
      } else {
        const { data: r } = await api.post('/documents/generate', {
          doc_type: docType, company_id: companyId, employee_id: employeeId || null, data
        });
        res = r;
      }
      toast.success('Document generated!');
      setResult(res);
      setGenerating(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
      setGenerating(false);
    }
  };

  const selectedType = TYPES.find(t => t.id === docType);

  return (
    <div className="min-h-screen pb-10" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fff7ed 100%)' }}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${C.gradient} text-white px-6 py-6 shadow-lg mb-6`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {selectedType && <selectedType.icon size={24} />} Generate Document
            </h1>
            <p className="text-white/80 text-sm mt-1">Select type, fill details, download PDF</p>
          </div>
          <button onClick={submit} disabled={generating}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white px-6 py-3 rounded-xl font-bold shadow transition disabled:opacity-60">
            {generating ? <Loader size={18} className="animate-spin" /> : <FileDown size={18} />}
            {generating ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-5">
        {/* Result Banner */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2"><CheckCircle size={18} /> Document Generated!</span>
              <span className="text-green-100 text-sm font-mono">{result.doc_number}</span>
            </div>
            <div className="p-4 flex gap-3">
              <a href={result.url} target="_blank" rel="noreferrer"
                className={`flex-1 text-center py-3 rounded-xl font-bold text-white bg-gradient-to-r ${C.gradient} hover:opacity-90 transition`}>
                View PDF
              </a>
              <a href={result.url} download
                className="flex-1 text-center py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center gap-2">
                <Download size={16} /> Download
              </a>
              <button onClick={() => nav('/documents')}
                className="flex-1 text-center py-3 rounded-xl font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                View History
              </button>
            </div>
          </div>
        )}

        {/* Doc Type Selector */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-5 py-3">
            <h2 className="text-white font-bold flex items-center gap-2"><FileText size={16} /> Select Document Type</h2>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => { setDocType(t.id); setResult(null); }}
                className={`relative p-4 rounded-xl border-2 transition text-left
                  ${docType === t.id ? `bg-gradient-to-br ${t.gradient} text-white border-transparent shadow-lg scale-105` : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <t.icon size={22} className={docType === t.id ? 'text-white mb-2' : 'text-gray-500 mb-2'} />
                <div className={`font-bold text-sm ${docType === t.id ? 'text-white' : 'text-gray-700'}`}>{t.label}</div>
                {docType === t.id && (
                  <div className="absolute top-2 right-2 bg-white/30 rounded-full p-0.5">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <form onSubmit={submit} className="lg:col-span-2 space-y-5">
            {/* Company & Employee */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3`}>
                <h3 className="text-white font-bold">Company & Employee</h3>
                <p className="text-blue-100 text-xs">Employee data auto-fills the document</p>
              </div>
              <div className={`${C.light} p-5 grid md:grid-cols-2 gap-4`}>
                <Field label="Company *" color={C.text}>
                  <select className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${C.ring} focus:border-transparent`}
                    value={companyId} onChange={e => setCompanyId(e.target.value)} required>
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Employee" color={C.text}>
                  <select className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${C.ring} focus:border-transparent`}
                    value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={!companyId}>
                    <option value="">Select or fill manually</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.emp_code}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Type-specific fields */}
            {docType === 'payslip' && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className={`bg-gradient-to-r ${C.gradient} px-5 py-3`}>
                  <h3 className="text-white font-bold flex items-center gap-2"><CreditCard size={16} /> Payslip Details</h3>
                </div>
                <div className={`${C.light} p-5`}>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <Field label="Pay Month" color={C.text}>
                      <select className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                        name="pay_month" value={data.pay_month||''} onChange={od}>
                        <option value="">Select Month</option>
                        {MONTHS.map(m => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Pay Year" color={C.text}>
                      <input type="number" className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                        name="pay_year" value={data.pay_year||''} onChange={od} placeholder="2026" />
                    </Field>
                    <Field label="Working Days" color={C.text}>
                      <input type="number" className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                        name="working_days" value={data.working_days||''} onChange={od} />
                    </Field>
                    <Field label="Paid Days" color={C.text}>
                      <input type="number" className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                        name="paid_days" value={data.paid_days||''} onChange={od} />
                    </Field>
                    <Field label="LOP Days" color={C.text}>
                      <input type="number" className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                        name="lop_days" value={data.lop_days||''} onChange={od} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-500 text-white rounded-xl p-3 text-center">
                      <div className="text-xs opacity-80">Gross Earnings</div>
                      <div className="font-bold">₹{Number(data.gross_earnings||0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-red-500 text-white rounded-xl p-3 text-center">
                      <div className="text-xs opacity-80">Deductions</div>
                      <div className="font-bold">₹{Number(data.total_deductions||0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-blue-600 text-white rounded-xl p-3 text-center">
                      <div className="text-xs opacity-80">Net Pay</div>
                      <div className="font-bold">₹{Number(data.net_pay||0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <Field label="Amount in Words" color={C.text}>
                    <input className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                      name="amount_in_words" value={data.amount_in_words||''} onChange={od} placeholder="Rupees Twenty Five Thousand Only" />
                  </Field>
                </div>
              </div>
            )}

            {docType === 'offer_letter' && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className={`bg-gradient-to-r ${C.gradient} px-5 py-3`}>
                  <h3 className="text-white font-bold flex items-center gap-2"><Sparkles size={16} /> Offer Details</h3>
                </div>
                <div className={`${C.light} p-5 grid md:grid-cols-3 gap-4`}>
                  <div className={`md:col-span-3 text-xs ${C.text} bg-orange-100 rounded-lg px-3 py-2`}>
                    Leave blank to use values from the employee record.
                  </div>
                  <Field label="Designation" color={C.text}>
                    <input className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                      name="offered_designation" value={data.offered_designation||''} onChange={od} />
                  </Field>
                  <Field label="Annual CTC" color={C.text}>
                    <div className="relative">
                      <span className={`absolute left-3 top-2.5 font-bold text-sm ${C.text}`}>₹</span>
                      <input type="number" className={`w-full pl-7 pr-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                        name="offered_ctc" value={data.offered_ctc||''} onChange={od} />
                    </div>
                  </Field>
                  <Field label="Joining Date" color={C.text}>
                    <input type="date" className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                      name="joining_date" value={data.joining_date||''} onChange={od} />
                  </Field>
                </div>
              </div>
            )}

            {(docType === 'experience_letter' || docType === 'relieving_letter') && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className={`bg-gradient-to-r ${C.gradient} px-5 py-3`}>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    {docType === 'experience_letter' ? <Award size={16} /> : <LogOut size={16} />}
                    {docType === 'experience_letter' ? 'Experience Letter Details' : 'Relieving Letter Details'}
                  </h3>
                </div>
                <div className={`${C.light} p-5 space-y-4`}>
                  <Field label="Last Working Day" color={C.text}>
                    <input type="date" className={`w-full max-w-xs px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring}`}
                      name="relieving_date" value={data.relieving_date||''} onChange={od} />
                  </Field>
                  {docType === 'experience_letter' && (
                    <Field label="Custom Summary Paragraph (optional)" color={C.text}>
                      <textarea rows={3} name="summary" value={data.summary||''} onChange={od}
                        placeholder="Leave blank to use default text. Or override: He/She was a diligent and hardworking..."
                        className={`w-full px-3 py-2.5 border ${C.border} rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${C.ring} resize-none`} />
                    </Field>
                  )}
                </div>
              </div>
            )}

            {/* ── Salary Increment Fields ── */}
            {docType === 'salary_increment' && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-3">
                  <h3 className="text-white font-bold flex items-center gap-2"><TrendingUp size={16} /> Increment Details</h3>
                  <p className="text-teal-100 text-xs">Enter CTC increment — new salary is auto-calculated</p>
                </div>
                <div className="bg-teal-50 p-5 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Effective Date *" color="text-teal-700">
                      <input type="date" name="increment_date" value={data.increment_date||''} onChange={od}
                        className="w-full px-3 py-2.5 border border-teal-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                    </Field>
                    <Field label="Increment Type" color="text-teal-700">
                      <div className="flex gap-2">
                        {[['percentage','% Percent'],['flat','₹ Flat/mo']].map(([v,l]) => (
                          <button key={v} type="button"
                            onClick={() => setData(d => ({ ...d, increment_type: v }))}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold border-2 transition
                              ${(data.increment_type||'percentage') === v
                                ? 'bg-teal-600 text-white border-teal-600 shadow'
                                : 'bg-white text-teal-700 border-teal-200 hover:border-teal-400'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label={(data.increment_type||'percentage') === 'percentage' ? 'Increment % *' : 'Monthly Flat (₹) *'} color="text-teal-700">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-sm text-teal-600">
                          {(data.increment_type||'percentage') === 'percentage' ? '%' : '₹'}
                        </span>
                        <input type="number" name="increment_value" value={data.increment_value||''} onChange={od}
                          placeholder={(data.increment_type||'percentage') === 'percentage' ? 'e.g. 15' : 'e.g. 5000'}
                          className="w-full pl-8 pr-3 py-2.5 border border-teal-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400" />
                      </div>
                    </Field>
                  </div>

                  {/* Live preview */}
                  {curCtc > 0 && incVal > 0 ? (
                    <div className="bg-white border border-teal-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-teal-700 flex items-center gap-1.5 mb-3">
                        <ArrowUpCircle size={13} /> Live Increment Preview
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Current CTC</p>
                          <p className="font-bold text-gray-700">₹{inrFmt(curCtc)}</p>
                          <p className="text-xs text-gray-400">₹{inrFmt(Math.round(curCtc/12))}/mo</p>
                        </div>
                        <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-200">
                          <p className="text-xs text-teal-600 mb-1">Increment</p>
                          <p className="font-bold text-teal-700">+₹{inrFmt(incAmt)}</p>
                          <p className="text-xs text-teal-500">annual</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                          <p className="text-xs text-emerald-600 mb-1">New CTC</p>
                          <p className="font-bold text-emerald-700">₹{inrFmt(newCtc)}</p>
                          <p className="text-xs text-emerald-500">₹{inrFmt(Math.round(newCtc/12))}/mo</p>
                        </div>
                      </div>
                    </div>
                  ) : !employeeId ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle size={13} /> Select an employee above to see the live increment preview.
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={generating}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition disabled:opacity-60 bg-gradient-to-r ${C.gradient}`}>
              {generating ? <Loader size={22} className="animate-spin" /> : <FileDown size={22} />}
              {generating ? 'Generating PDF...' : 'Generate Document'}
            </button>
          </form>

          {/* Right Info Panel */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className={`bg-gradient-to-r ${C.gradient} px-4 py-3`}>
                <h3 className="text-white font-bold text-sm">Selected Document</h3>
              </div>
              <div className="p-4 space-y-3">
                {TYPES.map(t => (
                  <div key={t.id} onClick={() => { setDocType(t.id); setResult(null); }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                      ${docType === t.id ? `bg-gradient-to-r ${t.gradient} text-white shadow` : 'hover:bg-gray-50 text-gray-600'}`}>
                    <t.icon size={16} />
                    <span className="text-sm font-medium">{t.label}</span>
                    {docType === t.id && <CheckCircle size={14} className="ml-auto" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-2">Tips</p>
              <ul className="text-xs text-blue-800 space-y-1.5">
                <li>• Select employee to auto-fill salary</li>
                <li>• PDF includes company logo & signature</li>
                <li>• Doc number is auto-generated</li>
                <li>• All docs saved in history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
