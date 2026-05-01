import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  GraduationCap, Building2, User, Briefcase, Award, Star,
  CheckCircle, Loader, Download, ChevronDown, ChevronUp,
  X, Plus, Eye, CalendarCheck
} from 'lucide-react';
import api from '../services/api';

const PERFORMANCE_OPTIONS = [
  { value: 'Excellent',         label: '★ Excellent',          bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400' },
  { value: 'Good',              label: '★ Good',               bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-400' },
  { value: 'Satisfactory',      label: '★ Satisfactory',       bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-400' },
  { value: 'NeedsImprovement',  label: '★ Needs Improvement',  bg: 'bg-red-100',     text: 'text-red-600',     border: 'border-red-400' },
];

const SECTIONS = [
  {
    id: 'company',
    label: 'Company',
    icon: Building2,
    gradient: 'from-violet-600 to-purple-700',
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    ring: 'focus:ring-violet-400',
    desc: 'Select the issuing company'
  },
  {
    id: 'intern',
    label: 'Intern Details',
    icon: User,
    gradient: 'from-blue-500 to-indigo-700',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    ring: 'focus:ring-blue-400',
    desc: 'Name, college, course and branch'
  },
  {
    id: 'internship',
    label: 'Internship Details',
    icon: Briefcase,
    gradient: 'from-indigo-500 to-violet-600',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    ring: 'focus:ring-indigo-400',
    desc: 'Department, duration, project & mentor'
  },
  {
    id: 'performance',
    label: 'Performance & Skills',
    icon: Award,
    gradient: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    ring: 'focus:ring-teal-400',
    desc: 'Rating, skills learned and remarks'
  },
];

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

export default function InternshipCertificate() {
  const [companies, setCompanies]   = useState([]);
  const [companyId, setCompanyId]   = useState('');
  const [open, setOpen]             = useState({ company: true, intern: true, internship: true, performance: true, attendance: false });
  const [generating, setGenerating] = useState(false); // false | 'internship' | 'attendance'
  const [result, setResult]         = useState(null);  // { ...data, type }

  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState([]);

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
    mentor_name: '',
    performance: '',
    remarks: '',
    // Attendance certificate fields
    total_working_days: '',
    days_present: '',
  });

  useEffect(() => {
    api.get('/companies').then(({ data }) => setCompanies(data));
  }, []);

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggle = id => setOpen(o => ({ ...o, [id]: !o[id] }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (!skillsList.includes(s)) setSkillsList(l => [...l, s]);
    setSkillInput('');
  };

  const removeSkill = s => setSkillsList(l => l.filter(x => x !== s));

  const handleSkillKeyDown = e => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  };

  // Auto-compute attendance percentage
  const attendancePct = form.total_working_days && form.days_present
    ? Math.round((Number(form.days_present) / Number(form.total_working_days)) * 100)
    : null;

  const generate = async (type = 'internship') => {
    if (!companyId) return toast.error('Please select a company');
    if (!form.intern_name.trim()) return toast.error('Intern name is required');
    if (!form.from_date || !form.to_date) return toast.error('Please fill From Date and To Date');
    if (type === 'attendance') {
      if (!form.total_working_days || !form.days_present) return toast.error('Total working days and days present are required for Attendance Certificate');
    }

    setGenerating(type);
    setResult(null);
    try {
      const endpoint = type === 'attendance'
        ? '/documents/generate-internship-attendance'
        : '/documents/generate-internship';
      const { data } = await api.post(endpoint, {
        company_id: companyId,
        intern: {
          ...form,
          skills: skillsList.join(', '),
          attendance_pct: attendancePct,
        },
      });
      setResult({ ...data, type });
      toast.success(type === 'attendance'
        ? 'Attendance Certificate generated!'
        : 'Internship Certificate generated!');
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
      {open[sec.id]
        ? <ChevronUp size={20} className="text-white/80" />
        : <ChevronDown size={20} className="text-white/80" />}
    </button>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)' }}>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-blue-700 text-white px-6 py-6 mb-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap size={26} /> Internship Certificate
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Generate a professional certificate of completion for interns
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => generate('internship')} disabled={!!generating}
              className="flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 px-4 py-2.5 rounded-xl font-bold shadow-lg transition disabled:opacity-60 text-sm">
              {generating === 'internship'
                ? <Loader size={16} className="animate-spin text-violet-600" />
                : <GraduationCap size={16} />}
              {generating === 'internship' ? 'Generating...' : 'Completion Cert'}
            </button>
            <button onClick={() => generate('attendance')} disabled={!!generating}
              className="flex items-center gap-2 bg-white/20 border border-white/50 text-white hover:bg-white/30 px-4 py-2.5 rounded-xl font-bold shadow-lg transition disabled:opacity-60 text-sm">
              {generating === 'attendance'
                ? <Loader size={16} className="animate-spin" />
                : <CalendarCheck size={16} />}
              {generating === 'attendance' ? 'Generating...' : 'Attendance Cert'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10">

        {/* Result Banner */}
        {result && (
          <div className="mb-6 bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
            <div className={`px-5 py-3 flex items-center gap-2 ${result?.type === 'attendance' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
              <CheckCircle size={20} className="text-white" />
              <span className="font-bold text-white text-sm">
                {result?.type === 'attendance' ? 'Attendance Certificate Generated!' : 'Internship Certificate Generated!'}
              </span>
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Document Number</p>
                <p className="font-mono font-bold text-gray-800">{result.doc_number}</p>
              </div>
              <div className="flex gap-3">
                <a href={result.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow">
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
          {/* FORM COLUMN */}
          <div className="lg:col-span-2 space-y-4">

            {/* SECTION 1 – Company */}
            {(() => { const sec = SECTIONS[0]; return (
              <div className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <Field label="Issuing Company *" color={sec.text}>
                      <SSelect ring={sec.ring} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                        <option value="">Select Company</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </SSelect>
                    </Field>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 2 – Intern Details */}
            {(() => { const sec = SECTIONS[1]; return (
              <div className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Intern Full Name *" color={sec.text}>
                        <SInput ring={sec.ring} name="intern_name" value={form.intern_name}
                          onChange={ch} placeholder="e.g. Priya Sharma" />
                      </Field>
                      <Field label="Roll No / Register No" color={sec.text}>
                        <SInput ring={sec.ring} name="roll_no" value={form.roll_no}
                          onChange={ch} placeholder="e.g. 21CS045 / 2021AU045" />
                      </Field>
                      <Field label="College / University" color={sec.text}>
                        <SInput ring={sec.ring} name="college" value={form.college}
                          onChange={ch} placeholder="e.g. Anna University" />
                      </Field>
                      <Field label="Course / Degree" color={sec.text}>
                        <SInput ring={sec.ring} name="course" value={form.course}
                          onChange={ch} placeholder="e.g. B.Tech / BCA / MBA" />
                      </Field>
                      <Field label="Branch / Specialization" color={sec.text}>
                        <SInput ring={sec.ring} name="branch" value={form.branch}
                          onChange={ch} placeholder="e.g. Computer Science" />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 3 – Internship Details */}
            {(() => { const sec = SECTIONS[2]; return (
              <div className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl`}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Department / Domain *" color={sec.text}>
                        <SInput ring={sec.ring} name="department" value={form.department}
                          onChange={ch} placeholder="e.g. Software Development" />
                      </Field>
                      <Field label="Project / Role Title" color={sec.text}>
                        <SInput ring={sec.ring} name="project_title" value={form.project_title}
                          onChange={ch} placeholder="e.g. React Web Application" />
                      </Field>
                      <Field label="From Date *" color={sec.text}>
                        <SInput ring={sec.ring} type="date" name="from_date"
                          value={form.from_date} onChange={ch} />
                      </Field>
                      <Field label="To Date *" color={sec.text}>
                        <SInput ring={sec.ring} type="date" name="to_date"
                          value={form.to_date} onChange={ch} />
                      </Field>
                      <Field label="Mentor / Supervisor Name" color={sec.text}>
                        <SInput ring={sec.ring} name="mentor_name" value={form.mentor_name}
                          onChange={ch} placeholder="e.g. Mr. Ramesh Kumar" />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 4 – Performance & Skills */}
            {(() => { const sec = SECTIONS[3]; return (
              <div className="rounded-2xl overflow-hidden shadow-md">
                <SectionHeader sec={sec} />
                {open[sec.id] && (
                  <div className={`${sec.light} p-5 border ${sec.border} border-t-0 rounded-b-2xl space-y-4`}>

                    {/* Performance Rating */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-teal-700">
                        Performance Rating
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {PERFORMANCE_OPTIONS.map(opt => (
                          <button key={opt.value} type="button"
                            onClick={() => setForm(f => ({ ...f, performance: f.performance === opt.value ? '' : opt.value }))}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition
                              ${form.performance === opt.value
                                ? `${opt.bg} ${opt.text} ${opt.border} shadow-sm`
                                : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-teal-700">
                        Skills & Technologies Learned
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={handleSkillKeyDown}
                          placeholder="Type a skill and press Enter or +"
                          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                        />
                        <button type="button" onClick={addSkill}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-4 rounded-lg font-bold transition flex items-center gap-1">
                          <Plus size={16} />
                        </button>
                      </div>
                      {skillsList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {skillsList.map(s => (
                            <span key={s} className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-semibold">
                              {s}
                              <button type="button" onClick={() => removeSkill(s)}
                                className="text-indigo-400 hover:text-indigo-700 transition">
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-teal-600 mt-1.5 opacity-70">
                        e.g. React.js, Node.js, Python, SQL
                      </p>
                    </div>

                    {/* Remarks */}
                    <Field label="Remarks / Special Notes" color={sec.text}>
                      <textarea
                        name="remarks" value={form.remarks} onChange={ch} rows={3}
                        placeholder="Optional: Any special mention, achievements or observations..."
                        className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm
                          focus:outline-none focus:ring-2 ${sec.ring} focus:border-transparent transition resize-none`}
                      />
                    </Field>
                  </div>
                )}
              </div>
            );})()}

            {/* SECTION 5 – Attendance (for Attendance Certificate only) */}
            <div className="rounded-2xl overflow-hidden shadow-md">
              <button type="button"
                onClick={() => toggle('attendance')}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><CalendarCheck size={18} /></div>
                  <div className="text-left">
                    <div className="font-bold text-base">Attendance Details</div>
                    <div className="text-xs text-white/80">Required only for Attendance Certificate</div>
                  </div>
                </div>
                {open.attendance ? <ChevronUp size={20} className="text-white/80" /> : <ChevronDown size={20} className="text-white/80" />}
              </button>
              {open.attendance && (
                <div className="bg-blue-50 p-5 border border-blue-200 border-t-0 rounded-b-2xl">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-blue-700">Total Working Days *</label>
                      <SInput ring="focus:ring-blue-400" type="number" name="total_working_days"
                        value={form.total_working_days} onChange={ch} placeholder="e.g. 60" min="1" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-blue-700">Days Present *</label>
                      <SInput ring="focus:ring-blue-400" type="number" name="days_present"
                        value={form.days_present} onChange={ch} placeholder="e.g. 57" min="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-blue-700">Attendance %</label>
                      <div className={`px-3 py-2.5 rounded-lg border text-sm font-bold text-center
                        ${attendancePct !== null
                          ? attendancePct >= 75 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-600'
                          : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        {attendancePct !== null ? `${attendancePct}%` : 'Auto-calculated'}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-500 mt-3 opacity-80">
                    ℹ️ Fill these fields only when generating an Attendance Certificate. Completion Certificate does not require them.
                  </p>
                </div>
              )}
            </div>

            {/* Generate Buttons */}
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={() => generate('internship')} disabled={!!generating}
                className="flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-base shadow-xl transition disabled:opacity-60 text-white"
                style={{ background: 'linear-gradient(135deg, #5b21b6, #4f46e5)' }}>
                {generating === 'internship' ? <Loader size={20} className="animate-spin" /> : <GraduationCap size={20} />}
                {generating === 'internship' ? 'Generating...' : 'Generate Completion Cert'}
              </button>
              <button onClick={() => generate('attendance')} disabled={!!generating}
                className="flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-base shadow-xl transition disabled:opacity-60 text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                {generating === 'attendance' ? <Loader size={20} className="animate-spin" /> : <CalendarCheck size={20} />}
                {generating === 'attendance' ? 'Generating...' : 'Generate Attendance Cert'}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">

            {/* Preview Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-700 to-indigo-700 px-4 py-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Star size={16} /> Certificate Preview
                </h3>
                <p className="text-violet-200 text-xs mt-0.5">Summary of entered details</p>
              </div>
              <div className="p-4 space-y-3">
                <Row label="Intern Name"  value={form.intern_name  || '—'} />
                {form.roll_no && <Row label="Roll No" value={form.roll_no} />}
                <Row label="College"      value={form.college      || '—'} />
                <Row label="Course"       value={[form.course, form.branch].filter(Boolean).join(' — ') || '—'} />
                <Row label="Department"   value={form.department   || '—'} />
                <Row label="Period"
                  value={form.from_date && form.to_date
                    ? `${formatDate(form.from_date)} → ${formatDate(form.to_date)}`
                    : '—'} />
                <Row label="Performance"
                  value={form.performance
                    ? <span className={`font-semibold ${PERFORMANCE_OPTIONS.find(o=>o.value===form.performance)?.text || ''}`}>
                        {form.performance}
                      </span>
                    : '—'} />
                {attendancePct !== null && (
                  <Row label="Attendance"
                    value={<span className={`font-bold ${attendancePct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {form.days_present}/{form.total_working_days} days ({attendancePct}%)
                    </span>} />
                )}
                {skillsList.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillsList.map(s => (
                        <span key={s} className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-2 py-0.5 text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-violet-700 mb-2 flex items-center gap-1.5">
                <GraduationCap size={13} /> Tips
              </p>
              <ul className="text-xs text-violet-800 space-y-1.5">
                <li>• Company logo & signature appear automatically</li>
                <li>• Duration (months/days) is calculated automatically</li>
                <li>• Press Enter after each skill to add it as a tag</li>
                <li>• Performance badge colour changes per rating</li>
                <li>• College, course & branch are optional</li>
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

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
