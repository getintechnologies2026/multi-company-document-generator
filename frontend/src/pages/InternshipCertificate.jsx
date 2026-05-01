import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  GraduationCap, Building2, User, Briefcase, Award, Star,
  CheckCircle, Loader, Download, ChevronDown, ChevronUp,
  X, Plus, Eye, CalendarCheck, Send, ClipboardCheck
} from 'lucide-react';
import api from '../services/api';

/* ─────────────────────────────────────────────────────── */
/*  CERT TYPE DEFINITIONS                                   */
/* ─────────────────────────────────────────────────────── */
const CERT_TYPES = [
  {
    id: 'offer',
    label: 'Offer Letter',
    icon: Send,
    gradient: 'from-amber-500 to-orange-600',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    ring: 'focus:ring-amber-400',
    desc: 'Invite intern to join',
    endpoint: '/documents/generate-internship-offer',
    activeCard: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent shadow-lg',
    inactiveCard: 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50',
  },
  {
    id: 'confirmation',
    label: 'Confirmation',
    icon: ClipboardCheck,
    gradient: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    ring: 'focus:ring-emerald-400',
    desc: 'Confirm joining',
    endpoint: '/documents/generate-internship-confirmation',
    activeCard: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent shadow-lg',
    inactiveCard: 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50',
  },
  {
    id: 'completion',
    label: 'Completion Cert',
    icon: GraduationCap,
    gradient: 'from-violet-600 to-purple-700',
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    ring: 'focus:ring-violet-400',
    desc: 'Certificate of completion',
    endpoint: '/documents/generate-internship',
    activeCard: 'bg-gradient-to-br from-violet-600 to-purple-700 text-white border-transparent shadow-lg',
    inactiveCard: 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50',
  },
  {
    id: 'attendance',
    label: 'Attendance Cert',
    icon: CalendarCheck,
    gradient: 'from-blue-500 to-indigo-600',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    ring: 'focus:ring-blue-400',
    desc: 'Attendance record',
    endpoint: '/documents/generate-internship-attendance',
    activeCard: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-lg',
    inactiveCard: 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50',
  },
];

const PERFORMANCE_OPTIONS = [
  { value: 'Excellent',        label: '★ Excellent',         bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400' },
  { value: 'Good',             label: '★ Good',              bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-400' },
  { value: 'Satisfactory',     label: '★ Satisfactory',      bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-400' },
  { value: 'NeedsImprovement', label: '★ Needs Improvement', bg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-400' },
];

/* ─────────────────────────────────────────────────────── */
/*  SMALL REUSABLE COMPONENTS                              */
/* ─────────────────────────────────────────────────────── */
function Field({ label, color = 'text-gray-600', children }) {
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

function SectionWrap({ title, icon: Icon, gradient, light, border, open, onToggle, children }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md">
      <button type="button" onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${gradient} text-white`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg"><Icon size={18} /></div>
          <div className="font-bold text-base text-left">{title}</div>
        </div>
        {open ? <ChevronUp size={20} className="text-white/80" /> : <ChevronDown size={20} className="text-white/80" />}
      </button>
      {open && (
        <div className={`${light} p-5 border ${border} border-t-0 rounded-b-2xl`}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                          */
/* ─────────────────────────────────────────────────────── */
export default function InternshipCertificate() {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [certType, setCertType]   = useState('offer');
  const [generating, setGenerating] = useState(false);
  const [result, setResult]         = useState(null);

  // Skill tags (completion cert)
  const [skillInput, setSkillInput]   = useState('');
  const [skillsList, setSkillsList]   = useState([]);

  // Topics tags (attendance cert)
  const [topicInput, setTopicInput]   = useState('');
  const [topicsList, setTopicsList]   = useState([]);

  // Section open/close
  const [open, setOpen] = useState({ company: true, intern: true, internship: true, extra: true });
  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }));

  // Form state — all fields for all types
  const [form, setForm] = useState({
    intern_name: '',
    roll_no: '',
    college: '',
    course: '',
    branch: '',
    department: '',
    project_title: '',
    from_date: '',
    to_date: '',
    joining_date: '',
    mentor_name: '',
    stipend: '',
    joining_instructions: '',
    performance: '',
    remarks: '',
    total_working_days: '',
    days_present: '',
  });

  useEffect(() => {
    api.get('/companies').then(({ data }) => setCompanies(data));
  }, []);

  // Reset result whenever cert type changes
  useEffect(() => { setResult(null); }, [certType]);

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Skills
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skillsList.includes(s)) return;
    setSkillsList(l => [...l, s]);
    setSkillInput('');
  };
  const removeSkill = s => setSkillsList(l => l.filter(x => x !== s));

  // Topics
  const addTopic = () => {
    const s = topicInput.trim();
    if (!s || topicsList.includes(s)) return;
    setTopicsList(l => [...l, s]);
    setTopicInput('');
  };
  const removeTopic = s => setTopicsList(l => l.filter(x => x !== s));

  const attendancePct = form.total_working_days && form.days_present
    ? Math.round((Number(form.days_present) / Number(form.total_working_days)) * 100)
    : null;

  const ct = CERT_TYPES.find(t => t.id === certType);

  /* ── GENERATE ── */
  const generate = async () => {
    if (!companyId) return toast.error('Please select a company');
    if (!form.intern_name.trim()) return toast.error('Intern name is required');
    if (!form.from_date || !form.to_date) return toast.error('From Date and To Date are required');
    if (certType === 'attendance') {
      if (!form.total_working_days || !form.days_present)
        return toast.error('Total working days and days present are required');
    }

    setGenerating(true);
    setResult(null);
    try {
      const payload = {
        company_id: companyId,
        intern: {
          ...form,
          skills: skillsList.join(', '),
          covered_topics: topicsList.join(', '),
          attendance_pct: attendancePct,
        },
      };
      const { data } = await api.post(ct.endpoint, payload);
      setResult({ ...data, certType });
      toast.success(`${ct.label} generated!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  /* ─────────────────────────────────────────────────────── */
  /*  RENDER                                                  */
  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 50%,#f0f9ff 100%)' }}>

      {/* Page Header */}
      <div className={`bg-gradient-to-r ${ct.gradient} text-white px-6 py-6 mb-6 shadow-lg`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap size={26} /> Internship Documents
            </h1>
            <p className="text-white/80 text-sm mt-1">Generate internship documents with one click</p>
          </div>
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 bg-white/20 border border-white/40 hover:bg-white/30
              text-white px-5 py-2.5 rounded-xl font-bold shadow transition disabled:opacity-60 text-sm">
            {generating ? <Loader size={16} className="animate-spin" /> : <ct.icon size={16} />}
            {generating ? 'Generating…' : `Generate ${ct.label}`}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10">

        {/* ── Certificate Type Selector ── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Document Type</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CERT_TYPES.map(t => (
              <button key={t.id} type="button" onClick={() => setCertType(t.id)}
                className={`relative p-3 rounded-xl border-2 transition text-left
                  ${certType === t.id ? t.activeCard : t.inactiveCard}`}>
                <t.icon size={20} className={`mb-2 ${certType === t.id ? 'text-white' : t.text}`} />
                <div className={`font-bold text-sm leading-tight ${certType === t.id ? 'text-white' : 'text-gray-700'}`}>{t.label}</div>
                <div className={`text-xs mt-0.5 ${certType === t.id ? 'text-white/80' : 'text-gray-400'}`}>{t.desc}</div>
                {certType === t.id && (
                  <div className="absolute top-2 right-2 bg-white/30 rounded-full p-0.5">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Result Banner ── */}
        {result && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
            <div className={`px-5 py-3 flex items-center gap-2 bg-gradient-to-r ${ct.gradient}`}>
              <CheckCircle size={20} className="text-white" />
              <span className="font-bold text-white text-sm">{ct.label} Generated!</span>
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Document Number</p>
                <p className="font-mono font-bold text-gray-800">{result.doc_number}</p>
              </div>
              <div className="flex gap-3">
                <a href={result.url} target="_blank" rel="noreferrer"
                  className={`flex items-center gap-2 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow bg-gradient-to-r ${ct.gradient}`}>
                  <Eye size={15} /> View PDF
                </a>
                <a href={result.url} download
                  className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow">
                  <Download size={15} /> Download
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── FORM ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Company */}
            <SectionWrap title="Company" icon={Building2}
              gradient={ct.gradient} light={ct.light} border={ct.border}
              open={open.company} onToggle={() => toggle('company')}>
              <Field label="Issuing Company *" color={ct.text}>
                <SSelect ring={ct.ring} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SSelect>
              </Field>
            </SectionWrap>

            {/* Intern Details */}
            <SectionWrap title="Intern Details" icon={User}
              gradient={ct.gradient} light={ct.light} border={ct.border}
              open={open.intern} onToggle={() => toggle('intern')}>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Intern Full Name *" color={ct.text}>
                  <SInput ring={ct.ring} name="intern_name" value={form.intern_name} onChange={ch} placeholder="e.g. Priya Sharma" />
                </Field>
                <Field label="Roll No / Register No" color={ct.text}>
                  <SInput ring={ct.ring} name="roll_no" value={form.roll_no} onChange={ch} placeholder="e.g. 21CS045" />
                </Field>
                <Field label="College / University" color={ct.text}>
                  <SInput ring={ct.ring} name="college" value={form.college} onChange={ch} placeholder="e.g. Anna University" />
                </Field>
                <Field label="Course / Degree" color={ct.text}>
                  <SInput ring={ct.ring} name="course" value={form.course} onChange={ch} placeholder="e.g. B.Tech / BCA" />
                </Field>
                <Field label="Branch / Specialization" color={ct.text}>
                  <SInput ring={ct.ring} name="branch" value={form.branch} onChange={ch} placeholder="e.g. Computer Science" />
                </Field>
              </div>
            </SectionWrap>

            {/* Internship Details */}
            <SectionWrap title="Internship Details" icon={Briefcase}
              gradient={ct.gradient} light={ct.light} border={ct.border}
              open={open.internship} onToggle={() => toggle('internship')}>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Department / Domain *" color={ct.text}>
                  <SInput ring={ct.ring} name="department" value={form.department} onChange={ch} placeholder="e.g. Software Development" />
                </Field>
                {(certType === 'completion' || certType === 'offer') && (
                  <Field label="Project / Role Title" color={ct.text}>
                    <SInput ring={ct.ring} name="project_title" value={form.project_title} onChange={ch} placeholder="e.g. React Web App" />
                  </Field>
                )}
                <Field label="From Date *" color={ct.text}>
                  <SInput ring={ct.ring} type="date" name="from_date" value={form.from_date} onChange={ch} />
                </Field>
                <Field label="To Date *" color={ct.text}>
                  <SInput ring={ct.ring} type="date" name="to_date" value={form.to_date} onChange={ch} />
                </Field>
                {certType === 'confirmation' && (
                  <Field label="Actual Joining Date" color={ct.text}>
                    <SInput ring={ct.ring} type="date" name="joining_date" value={form.joining_date} onChange={ch} />
                  </Field>
                )}
                <Field label="Mentor / Supervisor" color={ct.text}>
                  <SInput ring={ct.ring} name="mentor_name" value={form.mentor_name} onChange={ch} placeholder="e.g. Mr. Ramesh Kumar" />
                </Field>
                {/* Offer-specific: stipend */}
                {certType === 'offer' && (
                  <Field label="Monthly Stipend (₹)" color={ct.text}>
                    <SInput ring={ct.ring} name="stipend" value={form.stipend} onChange={ch} placeholder="e.g. 5000" type="number" min="0" />
                  </Field>
                )}
              </div>
              {/* Offer joining instructions */}
              {certType === 'offer' && (
                <div className="mt-4">
                  <Field label="Joining Instructions (Optional)" color={ct.text}>
                    <textarea name="joining_instructions" value={form.joining_instructions} onChange={ch} rows={2}
                      placeholder="e.g. Please bring your college ID on the first day..."
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                        focus:outline-none focus:ring-2 ${ct.ring} focus:border-transparent transition resize-none`} />
                  </Field>
                </div>
              )}
            </SectionWrap>

            {/* Performance & Skills — completion cert */}
            {certType === 'completion' && (
              <SectionWrap title="Performance & Skills" icon={Award}
                gradient={ct.gradient} light={ct.light} border={ct.border}
                open={open.extra} onToggle={() => toggle('extra')}>
                <div className="space-y-4">
                  {/* Performance Rating */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${ct.text}`}>Performance Rating</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PERFORMANCE_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, performance: f.performance === opt.value ? '' : opt.value }))}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition
                            ${form.performance === opt.value
                              ? `${opt.bg} ${opt.text} ${opt.border} shadow-sm`
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Skills */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${ct.text}`}>Skills & Technologies Learned</label>
                    <div className="flex gap-2 mb-2">
                      <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); }}}
                        placeholder="Type a skill and press Enter or +"
                        className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                          focus:outline-none focus:ring-2 ${ct.ring} focus:border-transparent transition`} />
                      <button type="button" onClick={addSkill}
                        className={`bg-gradient-to-r ${ct.gradient} text-white px-4 rounded-lg font-bold transition`}>
                        <Plus size={16} />
                      </button>
                    </div>
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {skillsList.map(s => (
                          <span key={s} className={`inline-flex items-center gap-1.5 ${ct.light} ${ct.text} border ${ct.border} rounded-full px-3 py-1 text-xs font-semibold`}>
                            {s}
                            <button type="button" onClick={() => removeSkill(s)} className="opacity-60 hover:opacity-100"><X size={11} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Remarks */}
                  <Field label="Remarks / Special Notes" color={ct.text}>
                    <textarea name="remarks" value={form.remarks} onChange={ch} rows={2}
                      placeholder="Optional: achievements or observations..."
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                        focus:outline-none focus:ring-2 ${ct.ring} focus:border-transparent transition resize-none`} />
                  </Field>
                </div>
              </SectionWrap>
            )}

            {/* Attendance Details — attendance cert */}
            {certType === 'attendance' && (
              <SectionWrap title="Attendance Details" icon={CalendarCheck}
                gradient={ct.gradient} light={ct.light} border={ct.border}
                open={open.extra} onToggle={() => toggle('extra')}>
                <div className="space-y-4">
                  {/* Days */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label="Total Working Days *" color={ct.text}>
                      <SInput ring={ct.ring} type="number" name="total_working_days"
                        value={form.total_working_days} onChange={ch} placeholder="e.g. 60" min="1" />
                    </Field>
                    <Field label="Days Present *" color={ct.text}>
                      <SInput ring={ct.ring} type="number" name="days_present"
                        value={form.days_present} onChange={ch} placeholder="e.g. 57" min="0" />
                    </Field>
                    <Field label="Attendance %" color={ct.text}>
                      <div className={`px-3 py-2.5 rounded-lg border text-sm font-bold text-center
                        ${attendancePct !== null
                          ? attendancePct >= 75 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-600'
                          : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        {attendancePct !== null ? `${attendancePct}%` : 'Auto-calculated'}
                      </div>
                    </Field>
                  </div>
                  {/* Performance Rating */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${ct.text}`}>Performance Rating</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PERFORMANCE_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, performance: f.performance === opt.value ? '' : opt.value }))}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition
                            ${form.performance === opt.value
                              ? `${opt.bg} ${opt.text} ${opt.border} shadow-sm`
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Covered Topics */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${ct.text}`}>Topics Covered</label>
                    <div className="flex gap-2 mb-2">
                      <input value={topicInput} onChange={e => setTopicInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); }}}
                        placeholder="e.g. React.js, REST APIs, Database Design..."
                        className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                          focus:outline-none focus:ring-2 ${ct.ring} focus:border-transparent transition`} />
                      <button type="button" onClick={addTopic}
                        className={`bg-gradient-to-r ${ct.gradient} text-white px-4 rounded-lg font-bold transition`}>
                        <Plus size={16} />
                      </button>
                    </div>
                    {topicsList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {topicsList.map(s => (
                          <span key={s} className={`inline-flex items-center gap-1.5 ${ct.light} ${ct.text} border ${ct.border} rounded-full px-3 py-1 text-xs font-semibold`}>
                            {s}
                            <button type="button" onClick={() => removeTopic(s)} className="opacity-60 hover:opacity-100"><X size={11} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Remarks */}
                  <Field label="Remarks" color={ct.text}>
                    <textarea name="remarks" value={form.remarks} onChange={ch} rows={2}
                      placeholder="Optional notes..."
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                        focus:outline-none focus:ring-2 ${ct.ring} focus:border-transparent transition resize-none`} />
                  </Field>
                </div>
              </SectionWrap>
            )}

            {/* Remarks — for offer / confirmation */}
            {(certType === 'offer' || certType === 'confirmation') && (
              <div className={`${ct.light} border ${ct.border} rounded-2xl p-5`}>
                <Field label="Remarks / Notes" color={ct.text}>
                  <textarea name="remarks" value={form.remarks} onChange={ch} rows={2}
                    placeholder="Optional: any special notes or instructions..."
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                      focus:outline-none focus:ring-2 ${ct.ring} focus:border-transparent transition resize-none`} />
                </Field>
              </div>
            )}

            {/* Generate Button */}
            <button onClick={generate} disabled={generating}
              className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-base
                shadow-xl transition disabled:opacity-60 text-white bg-gradient-to-r ${ct.gradient}`}>
              {generating ? <Loader size={20} className="animate-spin" /> : <ct.icon size={20} />}
              {generating ? 'Generating…' : `Generate ${ct.label}`}
            </button>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            {/* Preview */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className={`bg-gradient-to-r ${ct.gradient} px-4 py-3`}>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Star size={15} /> Preview
                </h3>
                <p className="text-white/70 text-xs mt-0.5">{ct.label} — {ct.desc}</p>
              </div>
              <div className="p-4 space-y-2.5">
                <Row label="Intern"     value={form.intern_name  || '—'} />
                {form.roll_no           && <Row label="Roll No"    value={form.roll_no} />}
                {form.college           && <Row label="College"    value={form.college} />}
                {(form.course || form.branch) && (
                  <Row label="Course" value={[form.course, form.branch].filter(Boolean).join(' — ')} />
                )}
                <Row label="Department" value={form.department    || '—'} />
                <Row label="Period"
                  value={form.from_date && form.to_date
                    ? `${fmtD(form.from_date)} → ${fmtD(form.to_date)}`
                    : '—'} />
                {certType === 'confirmation' && form.joining_date &&
                  <Row label="Joined" value={fmtD(form.joining_date)} />}
                {certType === 'offer' && form.stipend &&
                  <Row label="Stipend" value={`₹${form.stipend}/month`} />}
                {(certType === 'completion' || certType === 'attendance') && form.performance && (
                  <Row label="Performance"
                    value={<span className={`font-semibold ${PERFORMANCE_OPTIONS.find(o => o.value === form.performance)?.text || ''}`}>
                      {form.performance}
                    </span>} />
                )}
                {certType === 'attendance' && attendancePct !== null && (
                  <Row label="Attendance"
                    value={<span className={`font-bold ${attendancePct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {form.days_present}/{form.total_working_days} days ({attendancePct}%)
                    </span>} />
                )}
                {certType === 'completion' && skillsList.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillsList.map(s => (
                        <span key={s} className={`${ct.light} ${ct.text} border ${ct.border} rounded-full px-2 py-0.5 text-xs font-medium`}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {certType === 'attendance' && topicsList.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {topicsList.map(s => (
                        <span key={s} className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className={`${ct.light} border ${ct.border} rounded-2xl p-4`}>
              <p className={`text-xs font-bold ${ct.text} mb-2 flex items-center gap-1.5`}>
                <GraduationCap size={13} /> Tips
              </p>
              <ul className={`text-xs ${ct.text} space-y-1.5 opacity-80`}>
                {certType === 'offer' && <>
                  <li>• Stipend is optional — leave blank if unpaid</li>
                  <li>• Duration is auto-calculated from dates</li>
                  <li>• Includes intern acceptance signature block</li>
                </>}
                {certType === 'confirmation' && <>
                  <li>• Joining date defaults to From Date if blank</li>
                  <li>• Confirms the intern has officially started</li>
                  <li>• Use for university records submission</li>
                </>}
                {certType === 'completion' && <>
                  <li>• Performance badge colour changes per rating</li>
                  <li>• Press Enter after each skill to add it</li>
                  <li>• Company logo & signature auto-appear</li>
                </>}
                {certType === 'attendance' && <>
                  <li>• Attendance % is auto-calculated</li>
                  <li>• Press Enter after each topic to add it</li>
                  <li>• Performance rating is optional</li>
                </>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-xs text-gray-700 text-right">{value}</span>
    </div>
  );
}

function fmtD(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
