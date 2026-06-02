import { useEffect, useRef, useState } from 'react';
import {
  GraduationCap, Plus, Trash2, Download, Upload, Archive,
  CheckCircle, AlertCircle, Loader, Building2, Calendar,
  Users, FileText, Award, Layers, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ── Doc type config ───────────────────────────────────────────────────────────
const DOC_TYPES = [
  { key: 'offer',       label: 'Offer Letter',            color: 'from-orange-400 to-amber-500',   ring: 'ring-orange-400',  icon: FileText },
  { key: 'certificate', label: 'Completion Certificate',  color: 'from-violet-500 to-purple-600',  ring: 'ring-violet-400',  icon: Award },
  { key: 'attendance',  label: 'Attendance Certificate',  color: 'from-blue-500 to-cyan-500',      ring: 'ring-blue-400',    icon: Layers },
];

const PERFORMANCE_OPTS = ['', 'Excellent', 'Good', 'Satisfactory'];

// ── Blank student row ─────────────────────────────────────────────────────────
let _rowId = 1;
const blankStudent = () => ({
  _id: _rowId++,
  intern_name: '', roll_no: '', course: '', branch: '',
  email_id: '', mobile_no: '', performance: 'Good', skills: '',
  total_working_days: '', days_present: '',
  status: 'pending', docs: [], error: null,
});

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, error }) {
  if (status === 'pending') return <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500 font-semibold">Pending</span>;
  if (status === 'loading') return <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-semibold flex items-center gap-1 w-fit"><Loader size={9} className="animate-spin" />Generating</span>;
  if (status === 'done')    return <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1 w-fit"><CheckCircle size={9} />Done</span>;
  if (status === 'error')   return <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-600 font-semibold flex items-center gap-1 w-fit" title={error}><AlertCircle size={9} />Error</span>;
  return null;
}

// ── Inline cell input ─────────────────────────────────────────────────────────
function Cell({ value, onChange, placeholder, type = 'text', disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return {
      ...blankStudent(),
      intern_name:         obj.intern_name         || obj.name             || '',
      roll_no:             obj.roll_no             || obj.roll             || '',
      course:              obj.course              || '',
      branch:              obj.branch              || obj.dept             || '',
      email_id:            obj.email_id            || obj.email            || '',
      mobile_no:           obj.mobile_no           || obj.mobile           || '',
      performance:         obj.performance         || 'Good',
      skills:              obj.skills              || '',
      total_working_days:  obj.total_working_days  || obj.total_days       || '',
      days_present:        obj.days_present        || obj.present          || '',
    };
  });
}

// ── CSV template download ─────────────────────────────────────────────────────
function downloadCsvTemplate() {
  const header = 'intern_name,roll_no,course,branch,email_id,mobile_no,performance,skills,total_working_days,days_present';
  const example = 'Ravi Kumar,21CS001,B.E.,CSE,ravi@email.com,9876543210,Excellent,"Python,React",60,58';
  const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'bulk_internship_template.csv'; a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function BulkInternship() {
  const [companies,  setCompanies]  = useState([]);
  const [companyId,  setCompanyId]  = useState('');
  const [docTypes,   setDocTypes]   = useState({ offer: true, certificate: true, attendance: false });
  const [shared,     setShared]     = useState({
    college: '', department: '', from_date: '', to_date: '',
    supervisor: '', has_stipend: 'no', stipend: '',
  });
  const [students,   setStudents]   = useState([blankStudent(), blankStudent(), blankStudent()]);
  const [generating, setGenerating] = useState(false);
  const [zipUrl,     setZipUrl]     = useState(null);
  const [showShared, setShowShared] = useState(true);
  const csvRef = useRef(null);

  useEffect(() => {
    api.get('/companies').then(({ data }) => setCompanies(data)).catch(() => {});
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setSharedField = (k, v) => setShared(s => ({ ...s, [k]: v }));
  const toggleDocType  = k => setDocTypes(d => ({ ...d, [k]: !d[k] }));
  const selectedTypes  = Object.keys(docTypes).filter(k => docTypes[k]);
  const showAttCols    = docTypes.attendance;

  const updateStudent = (_id, field, value) =>
    setStudents(ss => ss.map(s => s._id === _id ? { ...s, [field]: value } : s));

  const addRow    = () => setStudents(ss => [...ss, blankStudent()]);
  const removeRow = (_id) => setStudents(ss => ss.filter(s => s._id !== _id));

  const doneCount  = students.filter(s => s.status === 'done').length;
  const errorCount = students.filter(s => s.status === 'error').length;

  // ── CSV import ───────────────────────────────────────────────────────────────
  const handleCsvImport = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseCsv(ev.target.result);
      if (!parsed.length) { toast.error('No valid rows found in CSV'); return; }
      setStudents(ss => {
        // Replace blank rows, then append non-blank extras
        const nonBlank = ss.filter(s => s.intern_name.trim());
        return [...nonBlank, ...parsed];
      });
      toast.success(`Imported ${parsed.length} student(s) from CSV`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Generate ─────────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!companyId)               return toast.error('Select a company');
    if (!selectedTypes.length)    return toast.error('Select at least one document type');
    if (!shared.from_date || !shared.to_date) return toast.error('From and To dates are required');
    if (!shared.college)          return toast.error('College name is required');

    const valid = students.filter(s => s.intern_name.trim());
    if (!valid.length)            return toast.error('Add at least one student with a name');

    // Mark all valid as loading
    setStudents(ss => ss.map(s =>
      s.intern_name.trim() ? { ...s, status: 'loading', docs: [], error: null } : s
    ));
    setZipUrl(null);
    setGenerating(true);

    try {
      const { data } = await api.post('/documents/generate-internship-bulk', {
        company_id: companyId,
        doc_types:  selectedTypes,
        shared,
        students:   valid.map(({ intern_name, roll_no, course, branch, email_id,
                                  mobile_no, performance, skills,
                                  total_working_days, days_present }) => ({
          intern_name, roll_no, course, branch, email_id,
          mobile_no, performance, skills,
          total_working_days: Number(total_working_days) || 0,
          days_present:       Number(days_present)       || 0,
        })),
      });

      // Map results back to student rows
      setStudents(ss => {
        const resultMap = {};
        (data.results || []).forEach(r => { resultMap[r.intern_name] = r; });
        return ss.map(s => {
          if (!s.intern_name.trim()) return s;
          const r = resultMap[s.intern_name];
          if (!r) return { ...s, status: 'error', error: 'No result returned' };
          const hasError = r.docs.some(d => !d.success);
          const allOk    = r.docs.every(d => d.success);
          return {
            ...s,
            status: allOk ? 'done' : hasError && r.docs.some(d => d.success) ? 'done' : 'error',
            docs:  r.docs,
            error: hasError ? r.docs.find(d => !d.success)?.error : null,
          };
        });
      });

      if (data.zipUrl) setZipUrl(data.zipUrl);
      toast.success(`Generated ${data.total_docs} document(s) for ${data.total_students} student(s)`);
    } catch (err) {
      // Mark all as error
      setStudents(ss => ss.map(s =>
        s.status === 'loading' ? { ...s, status: 'error', error: err.response?.data?.error || 'Failed' } : s
      ));
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const baseUrl = api.defaults?.baseURL?.replace('/api', '') || '';
  const isGenerated = students.some(s => s.status === 'done' || s.status === 'error');

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-12" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)' }}>

      {/* Header */}
      <div className="px-6 py-5 mb-6 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #6d28d9)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <GraduationCap size={20} /> Bulk Internship Documents
            </h1>
            <p className="text-purple-200 text-xs mt-0.5">
              Generate internship documents for multiple students from the same college at once
            </p>
          </div>
          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-white/15 text-white px-3 py-1 rounded-full font-semibold">
              {students.filter(s => s.intern_name.trim()).length} Students
            </span>
            {isGenerated && (
              <>
                {doneCount  > 0 && <span className="text-xs bg-emerald-400/30 text-emerald-100 px-3 py-1 rounded-full font-semibold">{doneCount} Done</span>}
                {errorCount > 0 && <span className="text-xs bg-red-400/30 text-red-100 px-3 py-1 rounded-full font-semibold">{errorCount} Error</span>}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-5">

        {/* ── CARD 1: Company + Doc Types ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
          <h2 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2">
            <Building2 size={15} className="text-purple-500" /> Company &amp; Document Types
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Company */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Company *</label>
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">— Select Company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Doc type toggles */}
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">Document Types *</label>
          <div className="flex flex-wrap gap-3">
            {DOC_TYPES.map(({ key, label, color, ring, icon: Icon }) => {
              const on = docTypes[key];
              return (
                <button key={key} type="button"
                  onClick={() => toggleDocType(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                    ${on
                      ? `bg-gradient-to-r ${color} text-white border-transparent shadow-md`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                  <Icon size={14} />
                  {label}
                  {on && <CheckCircle size={13} className="opacity-90" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CARD 2: Shared Details ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <button
            onClick={() => setShowShared(s => !s)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <h2 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Calendar size={15} className="text-purple-500" /> College &amp; Internship Details
              <span className="text-[10px] font-semibold text-gray-400 normal-case">(shared for all students)</span>
            </h2>
            {showShared ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showShared && (
            <div className="px-5 pb-5 border-t border-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">College / Institution *</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="e.g. Anna University"
                    value={shared.college}
                    onChange={e => setSharedField('college', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Department / Domain</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="e.g. Computer Science"
                    value={shared.department}
                    onChange={e => setSharedField('department', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">From Date *</label>
                  <input type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={shared.from_date}
                    onChange={e => setSharedField('from_date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">To Date *</label>
                  <input type="date"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    value={shared.to_date}
                    onChange={e => setSharedField('to_date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Supervisor / Mentor</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="e.g. Mr. Ramesh"
                    value={shared.supervisor}
                    onChange={e => setSharedField('supervisor', e.target.value)}
                  />
                </div>

                {/* Stipend toggle — offer letter only */}
                {docTypes.offer && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Monthly Stipend</label>
                    <div className="flex gap-3 items-center flex-wrap">
                      {[{ val: 'no', label: 'No Stipend (Unpaid)' }, { val: 'yes', label: 'Paid Stipend (₹)' }].map(opt => (
                        <button key={opt.val} type="button"
                          onClick={() => setSharedField('has_stipend', opt.val)}
                          className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition
                            ${shared.has_stipend === opt.val
                              ? opt.val === 'yes'
                                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent shadow'
                                : 'bg-gray-600 text-white border-transparent shadow'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                          {opt.label}
                        </button>
                      ))}
                      {shared.has_stipend === 'yes' && (
                        <input type="number" min="0"
                          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 w-40"
                          placeholder="Amount e.g. 15000"
                          value={shared.stipend}
                          onChange={e => setSharedField('stipend', e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── CARD 3: Students Table ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Users size={15} className="text-purple-500" />
              Students
              <span className="text-xs font-semibold text-gray-400">
                ({students.filter(s => s.intern_name.trim()).length} with name)
              </span>
            </h2>

            <div className="flex gap-2 flex-wrap">
              {/* CSV template download */}
              <button onClick={downloadCsvTemplate}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50 transition">
                <Download size={12} /> CSV Template
              </button>

              {/* CSV import */}
              <button onClick={() => csvRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 border border-emerald-200 rounded-lg transition">
                <Upload size={12} /> Import CSV
              </button>
              <input ref={csvRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvImport} />

              {/* Add row */}
              <button onClick={addRow}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 rounded-lg shadow transition hover:opacity-90">
                <Plus size={12} /> Add Row
              </button>
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-purple-50">
                  <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide w-6">#</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[140px]">Name *</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[90px]">Roll No</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[80px]">Course</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[80px]">Branch</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[140px]">Email</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[110px]">Mobile</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[100px]">Performance</th>
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[120px]">Skills</th>
                  {showAttCols && <>
                    <th className="px-2 py-2.5 text-left font-bold text-blue-500 uppercase tracking-wide min-w-[70px]">Total Days</th>
                    <th className="px-2 py-2.5 text-left font-bold text-blue-500 uppercase tracking-wide min-w-[70px]">Present</th>
                  </>}
                  <th className="px-2 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wide min-w-[80px]">Status</th>
                  <th className="px-2 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => (
                  <tr key={s._id} className={`${s.status === 'done' ? 'bg-emerald-50/40' : s.status === 'error' ? 'bg-red-50/40' : 'hover:bg-gray-50/60'} transition`}>
                    <td className="px-3 py-2 text-gray-400 font-bold">{i + 1}</td>
                    <td className="px-2 py-2">
                      <Cell value={s.intern_name} onChange={v => updateStudent(s._id, 'intern_name', v)} placeholder="Full name" disabled={generating} />
                    </td>
                    <td className="px-2 py-2">
                      <Cell value={s.roll_no} onChange={v => updateStudent(s._id, 'roll_no', v)} placeholder="21CS001" disabled={generating} />
                    </td>
                    <td className="px-2 py-2">
                      <Cell value={s.course} onChange={v => updateStudent(s._id, 'course', v)} placeholder="B.E." disabled={generating} />
                    </td>
                    <td className="px-2 py-2">
                      <Cell value={s.branch} onChange={v => updateStudent(s._id, 'branch', v)} placeholder="CSE" disabled={generating} />
                    </td>
                    <td className="px-2 py-2">
                      <Cell value={s.email_id} onChange={v => updateStudent(s._id, 'email_id', v)} placeholder="email@..." disabled={generating} />
                    </td>
                    <td className="px-2 py-2">
                      <Cell value={s.mobile_no} onChange={v => updateStudent(s._id, 'mobile_no', v)} placeholder="9876543210" disabled={generating} />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={s.performance}
                        onChange={e => updateStudent(s._id, 'performance', e.target.value)}
                        disabled={generating}
                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white disabled:bg-gray-50"
                      >
                        {PERFORMANCE_OPTS.map(p => <option key={p} value={p}>{p || '— None —'}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <Cell value={s.skills} onChange={v => updateStudent(s._id, 'skills', v)} placeholder="Python,React" disabled={generating} />
                    </td>
                    {showAttCols && <>
                      <td className="px-2 py-2">
                        <Cell value={s.total_working_days} onChange={v => updateStudent(s._id, 'total_working_days', v)} placeholder="60" type="number" disabled={generating} />
                      </td>
                      <td className="px-2 py-2">
                        <Cell value={s.days_present} onChange={v => updateStudent(s._id, 'days_present', v)} placeholder="58" type="number" disabled={generating} />
                      </td>
                    </>}
                    <td className="px-2 py-2">
                      <StatusBadge status={s.status} error={s.error} />
                      {/* Per-doc download links after generation */}
                      {s.status === 'done' && s.docs?.filter(d => d.success).map(d => (
                        <a key={d.doc_type}
                          href={`${baseUrl}${d.url}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-0.5 text-[10px] text-purple-600 hover:underline mt-0.5 w-fit">
                          <Download size={8} /> {d.doc_type}
                        </a>
                      ))}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeRow(s._id)} disabled={generating}
                        className="p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition disabled:opacity-40">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row footer */}
          <div className="px-5 py-3 border-t border-gray-50">
            <button onClick={addRow} disabled={generating}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition disabled:opacity-40">
              <Plus size={12} /> Add another student
            </button>
          </div>
        </div>

        {/* ── GENERATE BAR ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-100 px-5 py-4 flex items-center justify-between flex-wrap gap-4">

          {/* Summary */}
          <div className="text-sm text-gray-600">
            <span className="font-black text-gray-800">
              {students.filter(s => s.intern_name.trim()).length} students
            </span>
            {' × '}
            <span className="font-black text-purple-700">
              {selectedTypes.length || '—'} doc type{selectedTypes.length !== 1 ? 's' : ''}
            </span>
            {' = '}
            <span className="font-black text-gray-800">
              {students.filter(s => s.intern_name.trim()).length * selectedTypes.length} PDFs
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Download ZIP */}
            {zipUrl && (
              <a href={`${baseUrl}${zipUrl}`} download
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow transition">
                <Archive size={15} /> Download All as ZIP
              </a>
            )}

            {/* Generate button */}
            <button onClick={generate} disabled={generating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: generating ? '#9ca3af' : 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}>
              {generating
                ? <><Loader size={15} className="animate-spin" /> Generating...</>
                : <><GraduationCap size={15} /> Generate All</>}
            </button>
          </div>
        </div>

        {/* ── RESULTS SUMMARY ──────────────────────────────────────────── */}
        {isGenerated && (
          <div className={`rounded-2xl border px-5 py-4 flex items-center gap-3
            ${errorCount === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            {errorCount === 0
              ? <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              : <AlertCircle size={20} className="text-amber-500 shrink-0" />}
            <div>
              <p className="font-black text-sm text-gray-800">
                {errorCount === 0
                  ? `All ${doneCount} student(s) generated successfully!`
                  : `${doneCount} done, ${errorCount} failed — check error rows above`}
              </p>
              {zipUrl && (
                <p className="text-xs text-gray-500 mt-0.5">
                  ZIP ready — click "Download All as ZIP" to get all PDFs at once.
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
