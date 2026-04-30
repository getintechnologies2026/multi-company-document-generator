import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Calculator, TrendingUp, MapPin, Percent, Users,
  ChevronDown, ChevronUp, RefreshCw, Copy, CheckCircle,
  Landmark, Shield, FileText, Info, Star, Download
} from 'lucide-react';
import api from '../services/api';

const inr = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const pct = (n, base) => base > 0 ? ((n / base) * 100).toFixed(1) + '%' : '0%';

function SectionCard({ gradient, icon: Icon, title, subtitle, children, light, border }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full bg-gradient-to-r ${gradient} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl"><Icon size={18} className="text-white" /></div>
          <div className="text-left">
            <div className="text-white font-bold">{title}</div>
            <div className="text-white/70 text-xs">{subtitle}</div>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-white/70" /> : <ChevronDown size={18} className="text-white/70" />}
      </button>
      {open && <div className={`${light} p-5 border-t ${border}`}>{children}</div>}
    </div>
  );
}

function Field({ label, color, children }) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>{label}</label>
      {children}
    </div>
  );
}

function SSelect({ ring, children, ...p }) {
  return (
    <select {...p} className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition`}>
      {children}
    </select>
  );
}

function SInput({ ring, ...p }) {
  return (
    <input {...p} className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition placeholder:text-gray-300 ${p.className || ''}`} />
  );
}

function EarningRow({ label, amount, gross, color = 'text-gray-700', highlight }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 ${highlight ? 'bg-gray-50 rounded-lg px-2' : ''}`}>
      <div>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        {gross > 0 && <span className="text-xs text-gray-400 ml-2">({pct(amount, gross)} of gross)</span>}
      </div>
      <span className={`font-bold text-sm ${color}`}>₹{inr(amount)}</span>
    </div>
  );
}

export default function TNSalaryCalculator() {
  const [tnData, setTnData]     = useState(null);
  const [result, setResult]     = useState(null);
  const [copied, setCopied]     = useState(false);
  const [calculating, setCalc]  = useState(false);

  const [form, setForm] = useState({
    level: 6,
    basicPay: '',
    hraClass: 'Y',
    daPercent: 53,
    pensionType: 'NPS',
    pensionPercent: 10,
    children: 0,
    includeGIS: true,
    daOnTA: true,
    month: 'January',
    customAllowances: { special: '', other: '' },
    customDeductions: { tds: '', loan: '', other: '' },
  });

  useEffect(() => {
    api.get('/salary/tn-data').then(({ data }) => {
      setTnData(data);
      setForm(f => ({ ...f, daPercent: data.currentDA }));
    }).catch(() => toast.error('Could not load TN salary data'));
  }, []);

  // Auto-fill basic when level changes
  useEffect(() => {
    if (!tnData) return;
    const entry = tnData.payMatrix.find(p => p.level == form.level);
    if (entry) setForm(f => ({ ...f, basicPay: entry.basic }));
  }, [form.level, tnData]);

  // Auto-set pension percent based on type
  useEffect(() => {
    setForm(f => ({ ...f, pensionPercent: f.pensionType === 'NPS' ? 10 : 6 }));
  }, [form.pensionType]);

  const oc  = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const ocN = e => setForm(f => ({ ...f, [e.target.name]: Number(e.target.value) }));
  const ocB = e => setForm(f => ({ ...f, [e.target.name]: e.target.checked }));
  const ocCA = e => setForm(f => ({ ...f, customAllowances: { ...f.customAllowances, [e.target.name]: e.target.value } }));
  const ocCD = e => setForm(f => ({ ...f, customDeductions: { ...f.customDeductions, [e.target.name]: e.target.value } }));

  const calculate = async () => {
    setCalc(true);
    try {
      const { data } = await api.post('/salary/calculate', form);
      setResult(data);
      toast.success('Salary calculated!');
      setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Calculation failed');
    } finally {
      setCalc(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    const text = `TN Govt Salary — Level ${result.level} (${result.meta.category})
Basic Pay: ₹${inr(result.earnings.basic)}
DA (${result.daPercent}%): ₹${inr(result.earnings.da)}
HRA: ₹${inr(result.earnings.hra)}
Transport: ₹${inr(result.earnings.ta)}
Gross: ₹${inr(result.earnings.gross)}
Pension: ₹${inr(result.deductions.pension.amount)}
Prof Tax: ₹${inr(result.deductions.professionalTax)}
GIS: ₹${inr(result.deductions.gis)}
Total Deductions: ₹${inr(result.deductions.total)}
Net Pay: ₹${inr(result.netPay)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const matrixEntry = tnData?.payMatrix.find(p => p.level == form.level);

  return (
    <div className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #ecfdf5 40%, #eff6ff 100%)' }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 text-white px-6 py-6 shadow-lg mb-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl"><Calculator size={24} className="text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Tamil Nadu Govt Salary Calculator
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">7th Pay Commission</span>
              </h1>
              <p className="text-orange-100 text-sm mt-0.5">
                Calculate salary with Pay Matrix, DA, HRA, TA, Professional Tax & Pension
              </p>
            </div>
          </div>
          <button onClick={calculate} disabled={calculating}
            className="flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 px-6 py-3 rounded-xl font-bold shadow-lg transition">
            {calculating
              ? <RefreshCw size={18} className="animate-spin" />
              : <Calculator size={18} />}
            {calculating ? 'Calculating...' : 'Calculate Salary'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-5">

        {/* DA Alert */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Info size={18} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Current DA Rate: 53%</strong> (as of Jan 2026). DA is revised every 6 months (January & July).
            Update the DA% field below to reflect the latest revision.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT: Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* SECTION 1 — Pay Level */}
            <SectionCard gradient="from-orange-500 to-red-600" icon={Star}
              title="Pay Level & Basic Pay" subtitle="Select pay matrix level — basic auto-fills"
              light="bg-orange-50" border="border-orange-100">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="Pay Matrix Level" color="text-orange-700">
                    <SSelect ring="focus:ring-orange-400" name="level" value={form.level} onChange={ocN}>
                      {tnData?.payMatrix.map(p => (
                        <option key={p.level} value={p.level}>
                          {p.label} — ₹{p.basic.toLocaleString('en-IN')} — {p.description}
                        </option>
                      ))}
                    </SSelect>
                  </Field>
                </div>
                {matrixEntry && (
                  <div className="md:col-span-2 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Category',    value: matrixEntry.category },
                      { label: 'Starting Pay', value: `₹${matrixEntry.basic.toLocaleString('en-IN')}` },
                      { label: 'Post',         value: matrixEntry.description },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-orange-100 border border-orange-200 rounded-xl p-3 text-center">
                        <div className="text-xs text-orange-600 font-bold uppercase">{label}</div>
                        <div className="text-sm font-bold text-orange-900 mt-1">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Field label="Basic Pay (Override)" color="text-orange-700">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-orange-400 font-bold text-sm">₹</span>
                    <SInput ring="focus:ring-orange-400" type="number" name="basicPay"
                      value={form.basicPay} onChange={oc} className="pl-7" placeholder="Auto from level" />
                  </div>
                </Field>
                <Field label="Dearness Allowance %" color="text-orange-700">
                  <div className="relative">
                    <Percent size={13} className="absolute left-3 top-3 text-orange-400" />
                    <SInput ring="focus:ring-orange-400" type="number" name="daPercent"
                      value={form.daPercent} onChange={ocN} className="pl-8" />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* SECTION 2 — HRA & Location */}
            <SectionCard gradient="from-emerald-500 to-teal-600" icon={MapPin}
              title="HRA & City Classification" subtitle="City class determines HRA percentage"
              light="bg-emerald-50" border="border-emerald-100">
              <div className="grid md:grid-cols-3 gap-3">
                {['X', 'Y', 'Z'].map(cls => (
                  <button key={cls} type="button" onClick={() => setForm(f => ({ ...f, hraClass: cls }))}
                    className={`p-4 rounded-2xl border-2 text-left transition
                      ${form.hraClass === cls
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-lg'
                        : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                    <div className={`text-2xl font-black mb-1 ${form.hraClass === cls ? 'text-white' : 'text-emerald-700'}`}>
                      {cls} Class
                    </div>
                    <div className={`text-lg font-bold ${form.hraClass === cls ? 'text-yellow-300' : 'text-emerald-600'}`}>
                      {tnData?.hraCities[cls]?.percent}% HRA
                    </div>
                    <div className={`text-xs mt-1 ${form.hraClass === cls ? 'text-white/80' : 'text-gray-500'}`}>
                      {cls === 'X' && 'Chennai'}
                      {cls === 'Y' && 'CBE / MDU / Trichy / Salem'}
                      {cls === 'Z' && 'All Other Cities'}
                    </div>
                    {form.hraClass === cls && <CheckCircle size={16} className="text-white mt-2" />}
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* SECTION 3 — Pension */}
            <SectionCard gradient="from-violet-500 to-purple-700" icon={Shield}
              title="Pension Scheme" subtitle="NPS (post Apr 2003) or GPF (Old Pension Scheme)"
              light="bg-violet-50" border="border-violet-100">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Pension Type" color="text-violet-700">
                  <div className="grid grid-cols-2 gap-3">
                    {['NPS', 'GPF'].map(type => (
                      <button key={type} type="button"
                        onClick={() => setForm(f => ({ ...f, pensionType: type }))}
                        className={`p-3 rounded-xl border-2 text-center transition font-bold
                          ${form.pensionType === type
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent shadow'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                        <div className="text-sm">{type}</div>
                        <div className={`text-xs mt-0.5 font-normal ${form.pensionType === type ? 'text-white/80' : 'text-gray-400'}`}>
                          {type === 'NPS' ? 'Post Apr 2003' : 'Pre Apr 2003'}
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={`${form.pensionType} Contribution %`} color="text-violet-700">
                  <div className="relative">
                    <Percent size={13} className="absolute left-3 top-3 text-violet-400" />
                    <SInput ring="focus:ring-violet-400" type="number" name="pensionPercent"
                      value={form.pensionPercent} onChange={ocN} className="pl-8"
                      placeholder={form.pensionType === 'NPS' ? '10' : '6'} />
                  </div>
                  <p className="text-xs text-violet-500 mt-1">
                    {form.pensionType === 'NPS' ? 'Employee contributes 10% of Basic+DA. Govt contributes 14%.' : 'Minimum 6% of Basic Pay.'}
                  </p>
                </Field>
              </div>
            </SectionCard>

            {/* SECTION 4 — Allowances */}
            <SectionCard gradient="from-cyan-500 to-blue-600" icon={TrendingUp}
              title="Additional Allowances" subtitle="Children education, special and other allowances"
              light="bg-cyan-50" border="border-cyan-100">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Children (for Education Allowance)" color="text-cyan-700">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(n => (
                      <button key={n} type="button"
                        onClick={() => setForm(f => ({ ...f, children: n }))}
                        className={`py-2.5 rounded-xl border-2 font-bold transition text-sm
                          ${form.children === n
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-cyan-300'}`}>
                        {n === 0 ? 'None' : n === 1 ? '1 Child' : '2 Children'}
                      </button>
                    ))}
                  </div>
                  {form.children > 0 && (
                    <p className="text-xs text-cyan-600 mt-1.5">
                      ₹{(form.children * 2250).toLocaleString('en-IN')}/month (₹2,250 × {form.children})
                    </p>
                  )}
                </Field>
                <div className="space-y-3">
                  <Field label="Special Allowance (₹)" color="text-cyan-700">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-cyan-400 font-bold text-sm">₹</span>
                      <SInput ring="focus:ring-cyan-400" type="number" name="special"
                        value={form.customAllowances.special} onChange={ocCA} className="pl-7" placeholder="0" />
                    </div>
                  </Field>
                  <Field label="Other Allowances (₹)" color="text-cyan-700">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-cyan-400 font-bold text-sm">₹</span>
                      <SInput ring="focus:ring-cyan-400" type="number" name="other"
                        value={form.customAllowances.other} onChange={ocCA} className="pl-7" placeholder="0" />
                    </div>
                  </Field>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'DA on TA', key: 'daOnTA', desc: 'Apply DA percentage on Transport Allowance' },
                  { label: 'Include GIS', key: 'includeGIS', desc: 'Group Insurance Scheme deduction' },
                ].map(({ label, key, desc }) => (
                  <label key={key} className="flex items-start gap-3 bg-white border border-cyan-200 rounded-xl p-3 cursor-pointer hover:bg-cyan-50 transition">
                    <input type="checkbox" name={key} checked={form[key]} onChange={ocB} className="mt-0.5 accent-cyan-600" />
                    <div>
                      <div className="text-sm font-bold text-cyan-700">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </SectionCard>

            {/* SECTION 5 — Deductions */}
            <SectionCard gradient="from-rose-500 to-red-700" icon={Landmark}
              title="Additional Deductions" subtitle="TDS, loans and other deductions"
              light="bg-rose-50" border="border-rose-100">
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Month (for Prof. Tax)" color="text-rose-700">
                  <SSelect ring="focus:ring-rose-400" name="month" value={form.month} onChange={oc}>
                    {['January','February','March','April','May','June','July','August','September','October','November','December']
                      .map(m => <option key={m}>{m}</option>)}
                  </SSelect>
                  {form.month === 'February' && (
                    <p className="text-xs text-rose-600 mt-1">⚠️ February PT = ₹2,500 (annual catch-up)</p>
                  )}
                </Field>
                <Field label="TDS (₹)" color="text-rose-700">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-rose-400 font-bold text-sm">₹</span>
                    <SInput ring="focus:ring-rose-400" type="number" name="tds"
                      value={form.customDeductions.tds} onChange={ocCD} className="pl-7" placeholder="0" />
                  </div>
                </Field>
                <Field label="Loan / Recovery (₹)" color="text-rose-700">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-rose-400 font-bold text-sm">₹</span>
                    <SInput ring="focus:ring-rose-400" type="number" name="loan"
                      value={form.customDeductions.loan} onChange={ocCD} className="pl-7" placeholder="0" />
                  </div>
                </Field>
              </div>
            </SectionCard>

            {/* Calculate Button */}
            <button onClick={calculate} disabled={calculating}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626, #9f1239)' }}>
              {calculating ? <RefreshCw size={22} className="animate-spin" /> : <Calculator size={22} />}
              {calculating ? 'Calculating...' : 'Calculate Full Salary Breakdown'}
            </button>
          </div>

          {/* RIGHT: Result / Reference */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Quick Reference */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2"><Info size={14}/>TN PT Slabs</h3>
              </div>
              <div className="p-3">
                {tnData?.profTaxSlabs.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 text-xs">
                    <span className="text-gray-600">
                      {s.max === null || s.max > 1000000
                        ? `Above ₹75,000`
                        : `₹${s.min.toLocaleString('en-IN')} – ₹${s.max.toLocaleString('en-IN')}`}
                    </span>
                    <span className={`font-bold ${s.monthly === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {s.monthly === 0 ? 'Nil' : `₹${s.monthly}/mo`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GIS Reference */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3">
                <h3 className="text-white font-bold text-sm">GIS Rates</h3>
              </div>
              <div className="p-3 space-y-1.5">
                {tnData?.gisRates.map((g, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{g.label}</span>
                    <span className="font-bold text-violet-700">₹{g.monthly}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RESULT SECTION ── */}
        {result && (
          <div id="result-section" className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-200">
            {/* Result Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 px-6 py-5">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="text-white text-sm font-medium">Level {result.level} — {result.meta.category}</div>
                  <div className="text-white text-xl font-bold mt-0.5">{result.meta.description}</div>
                  <div className="text-green-100 text-xs mt-1">{result.meta.hraCity} • {result.pensionType} • DA {result.daPercent}%</div>
                </div>
                <div className="text-right">
                  <div className="text-green-100 text-xs">Monthly Net Pay</div>
                  <div className="text-white text-3xl font-black">₹{inr(result.netPay)}</div>
                  <button onClick={copyResult}
                    className="mt-2 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition">
                    {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy Summary'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {/* Earnings */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="font-bold text-gray-700">Earnings</h3>
                </div>
                <EarningRow label="Basic Pay"             amount={result.earnings.basic}            gross={result.earnings.gross} color="text-gray-800" />
                <EarningRow label={`DA (${result.daPercent}%)`} amount={result.earnings.da}         gross={result.earnings.gross} color="text-blue-700" />
                <EarningRow label={`HRA (${result.meta.hraPercent}% — ${result.hraClass} Class)`} amount={result.earnings.hra} gross={result.earnings.gross} color="text-emerald-700" />
                <EarningRow label="Transport Allowance"   amount={result.earnings.ta}               gross={result.earnings.gross} color="text-teal-700" />
                <EarningRow label="Medical Allowance"     amount={result.earnings.medical}          gross={result.earnings.gross} color="text-cyan-700" />
                {result.earnings.childEdu > 0 && (
                  <EarningRow label="Children Education"  amount={result.earnings.childEdu}         gross={result.earnings.gross} color="text-indigo-700" />
                )}
                {result.earnings.special > 0 && (
                  <EarningRow label="Special Allowance"   amount={result.earnings.special}          gross={result.earnings.gross} color="text-violet-700" />
                )}
                {result.earnings.otherAllowances > 0 && (
                  <EarningRow label="Other Allowances"    amount={result.earnings.otherAllowances}  gross={result.earnings.gross} color="text-purple-700" />
                )}
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="font-bold text-green-800">Gross Earnings</span>
                  <span className="font-black text-green-700 text-lg">₹{inr(result.earnings.gross)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <h3 className="font-bold text-gray-700">Deductions</h3>
                </div>
                <EarningRow label={`${result.deductions.pension.type} (${result.pensionPercent}%)`} amount={result.deductions.pension.amount} gross={0} color="text-red-700" />
                <EarningRow label="Group Insurance (GIS)"    amount={result.deductions.gis}               gross={0} color="text-rose-700" />
                <EarningRow label={`Prof. Tax (${form.month})`} amount={result.deductions.professionalTax} gross={0} color="text-pink-700" />
                {result.deductions.tds > 0 && (
                  <EarningRow label="TDS (Income Tax)"       amount={result.deductions.tds}               gross={0} color="text-orange-700" />
                )}
                {result.deductions.loan > 0 && (
                  <EarningRow label="Loan / Recovery"        amount={result.deductions.loan}              gross={0} color="text-amber-700" />
                )}
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="font-bold text-red-800">Total Deductions</span>
                  <span className="font-black text-red-700 text-lg">₹{inr(result.deductions.total)}</span>
                </div>

                {/* Net Pay Box */}
                <div className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white text-center shadow-lg">
                  <div className="text-xs font-medium opacity-80">Monthly Net Pay (In-Hand)</div>
                  <div className="text-3xl font-black mt-1">₹{inr(result.netPay)}</div>
                  <div className="text-xs opacity-70 mt-1">Annual: ₹{inr(result.netPay * 12)}</div>
                </div>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-gray-50 border-t px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Gross Earnings',    value: `₹${inr(result.earnings.gross)}`,    color: 'text-green-700' },
                { label: 'Total Deductions',  value: `₹${inr(result.deductions.total)}`,  color: 'text-red-700'   },
                { label: 'Net Pay / Month',   value: `₹${inr(result.netPay)}`,            color: 'text-blue-700'  },
                { label: 'Net Pay / Year',    value: `₹${inr(result.netPay * 12)}`,       color: 'text-indigo-700'},
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className="text-xs text-gray-500 font-medium">{label}</div>
                  <div className={`font-bold text-sm mt-0.5 ${color}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
