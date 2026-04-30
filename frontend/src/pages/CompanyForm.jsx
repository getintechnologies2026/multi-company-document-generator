import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2, MapPin, Phone, FileText, PenTool,
  Image, Save, ArrowLeft, CheckCircle, Hash, Globe,
  Mail, Loader, Upload, X
} from 'lucide-react';
import api from '../services/api';

const initial = {
  name: '', address: '', city: '', state: '', pincode: '',
  email: '', phone: '', website: '', gst_no: '', pan_no: '',
  signatory_name: '', signatory_designation: '', doc_number_prefix: ''
};

/* ── reusable field ── */
function Field({ label, color = 'text-gray-500', required, children }) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── styled input ── */
function SInput({ ring = 'focus:ring-blue-400', icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white shadow-sm
          focus:outline-none focus:ring-2 ${ring} focus:border-transparent transition placeholder:text-gray-300 ${props.className || ''}`}
      />
    </div>
  );
}

/* ── image upload card ── */
function ImageUpload({ label, name, icon: Icon, color, gradient, preview, onChange, onClear }) {
  const ref = useRef();
  return (
    <div className={`rounded-2xl border-2 border-dashed ${color} overflow-hidden`}>
      <div className={`bg-gradient-to-r ${gradient} px-4 py-2.5 flex items-center gap-2`}>
        <Icon size={15} className="text-white" />
        <span className="text-white font-bold text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="p-4">
        {preview ? (
          <div className="relative group">
            <img src={preview} alt={label}
              className="h-24 mx-auto object-contain rounded-xl border border-gray-100 bg-gray-50 p-1" />
            <button type="button" onClick={onClear}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
              <X size={12} />
            </button>
            <p className="text-xs text-center text-green-600 font-medium mt-2 flex items-center justify-center gap-1">
              <CheckCircle size={12} /> Uploaded
            </p>
          </div>
        ) : (
          <button type="button" onClick={() => ref.current.click()}
            className="w-full flex flex-col items-center gap-2 py-4 text-gray-400 hover:text-gray-600 transition">
            <Upload size={24} className="text-gray-300" />
            <span className="text-xs font-medium">Click to upload</span>
            <span className="text-xs text-gray-300">PNG, JPG, SVG</span>
          </button>
        )}
        {!preview && (
          <button type="button" onClick={() => ref.current.click()}
            className={`mt-1 w-full py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${gradient} hover:opacity-90 transition flex items-center justify-center gap-1`}>
            <Upload size={12} /> Choose File
          </button>
        )}
        <input ref={ref} type="file" name={name} accept="image/*" onChange={onChange} className="hidden" />
      </div>
    </div>
  );
}

/* ── section header ── */
function SectionHeader({ gradient, icon: Icon, title, subtitle }) {
  return (
    <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center gap-3`}>
      <div className="bg-white/20 p-2 rounded-xl"><Icon size={18} className="text-white" /></div>
      <div>
        <div className="text-white font-bold">{title}</div>
        <div className="text-white/70 text-xs">{subtitle}</div>
      </div>
    </div>
  );
}

export default function CompanyForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(initial);
  const [files, setFiles] = useState({ logo: null, signature: null, stamp: null });
  const [previews, setPreviews] = useState({ logo: null, signature: null, stamp: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) api.get(`/companies/${id}`).then(({ data }) => {
      setForm(data);
      setPreviews({
        logo:      data.logo_path      ? `/uploads/${data.logo_path}`      : null,
        signature: data.signature_path ? `/uploads/${data.signature_path}` : null,
        stamp:     data.stamp_path     ? `/uploads/${data.stamp_path}`     : null
      });
    });
  }, [id]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = e.target.name;
    setFiles(f => ({ ...f, [name]: file }));
    setPreviews(p => ({ ...p, [name]: URL.createObjectURL(file) }));
  };

  const clearFile = (name) => {
    setFiles(f => ({ ...f, [name]: null }));
    setPreviews(p => ({ ...p, [name]: null }));
    setForm(f => ({ ...f, [`${name}_path`]: null }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Company name is required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
      if (id) await api.put(`/companies/${id}`, fd);
      else await api.post('/companies', fd);
      toast.success(id ? 'Company updated!' : 'Company created!');
      nav('/companies');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>

      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-brand-800 via-blue-700 to-indigo-700 text-white px-6 py-6 shadow-lg mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{id ? 'Edit Company' : 'Add New Company'}</h1>
              <p className="text-blue-200 text-sm">
                {id ? 'Update company information and branding' : 'Fill in details to register a new company'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => nav('/companies')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={submit} disabled={saving}
              className="flex items-center gap-2 bg-white text-brand-800 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow transition disabled:opacity-60">
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Company'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="max-w-4xl mx-auto px-4 space-y-5">

        {/* ── SECTION 1: Basic Info ── */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <SectionHeader
            gradient="from-blue-500 to-blue-700"
            icon={Building2}
            title="Basic Information"
            subtitle="Company name, contact details and web presence"
          />
          <div className="bg-blue-50 p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Company Name" color="text-blue-700" required>
                  <SInput
                    ring="focus:ring-blue-400"
                    icon={Building2}
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    required
                  />
                </Field>
              </div>
              <Field label="Email Address" color="text-blue-700">
                <SInput ring="focus:ring-blue-400" icon={Mail} type="email" name="email" value={form.email} onChange={onChange} placeholder="hr@company.com" />
              </Field>
              <Field label="Phone Number" color="text-blue-700">
                <SInput ring="focus:ring-blue-400" icon={Phone} name="phone" value={form.phone} onChange={onChange} placeholder="+91-98765 43210" />
              </Field>
              <Field label="Website" color="text-blue-700">
                <SInput ring="focus:ring-blue-400" icon={Globe} name="website" value={form.website} onChange={onChange} placeholder="www.company.com" />
              </Field>
              <Field label="Document Number Prefix" color="text-blue-700">
                <SInput ring="focus:ring-blue-400" icon={Hash} name="doc_number_prefix" value={form.doc_number_prefix} onChange={onChange} placeholder="e.g. ACME → ACME/OFR/2026/0001" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Address ── */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <SectionHeader
            gradient="from-emerald-500 to-green-700"
            icon={MapPin}
            title="Address & Location"
            subtitle="Registered office address details"
          />
          <div className="bg-emerald-50 p-5 space-y-4">
            <Field label="Street Address" color="text-emerald-700">
              <textarea
                name="address" value={form.address} onChange={onChange} rows={2}
                placeholder="Building No, Street Name, Area..."
                className="w-full px-3 py-2.5 border border-emerald-200 rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none placeholder:text-gray-300"
              />
            </Field>
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="City" color="text-emerald-700">
                <SInput ring="focus:ring-emerald-400" name="city" value={form.city} onChange={onChange} placeholder="Bangalore" />
              </Field>
              <Field label="State" color="text-emerald-700">
                <SInput ring="focus:ring-emerald-400" name="state" value={form.state} onChange={onChange} placeholder="Karnataka" />
              </Field>
              <Field label="Pincode" color="text-emerald-700">
                <SInput ring="focus:ring-emerald-400" name="pincode" value={form.pincode} onChange={onChange} placeholder="560001" />
              </Field>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Legal & Tax ── */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <SectionHeader
            gradient="from-amber-500 to-orange-600"
            icon={FileText}
            title="Legal & Tax Details"
            subtitle="GST, PAN and official registration numbers"
          />
          <div className="bg-amber-50 p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="GST Number" color="text-amber-700">
                <SInput ring="focus:ring-amber-400" name="gst_no" value={form.gst_no} onChange={onChange} placeholder="27AABCU9603R1ZX" />
              </Field>
              <Field label="PAN Number" color="text-amber-700">
                <SInput ring="focus:ring-amber-400" name="pan_no" value={form.pan_no} onChange={onChange} placeholder="AABCU9603R" />
              </Field>
            </div>
            {/* GST / PAN format hints */}
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div className="bg-amber-100 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">GST Format</p>
                <p className="text-xs text-amber-600 font-mono">2 digits + 10 PAN + 1 + Z + 1 check</p>
                <p className="text-xs text-amber-600">e.g. <span className="font-bold">27AABCU9603R1ZX</span></p>
              </div>
              <div className="bg-amber-100 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">PAN Format</p>
                <p className="text-xs text-amber-600 font-mono">5 letters + 4 digits + 1 letter</p>
                <p className="text-xs text-amber-600">e.g. <span className="font-bold">ABCDE1234F</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Signatory ── */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <SectionHeader
            gradient="from-violet-500 to-purple-700"
            icon={PenTool}
            title="Signatory Details"
            subtitle="Person who signs the documents on company's behalf"
          />
          <div className="bg-violet-50 p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Signatory Name" color="text-violet-700">
                <SInput ring="focus:ring-violet-400" name="signatory_name" value={form.signatory_name} onChange={onChange} placeholder="John Doe" />
              </Field>
              <Field label="Signatory Designation" color="text-violet-700">
                <SInput ring="focus:ring-violet-400" name="signatory_designation" value={form.signatory_designation} onChange={onChange} placeholder="HR Manager / Director" />
              </Field>
            </div>
            <div className="mt-4 bg-violet-100 border border-violet-200 rounded-xl p-3">
              <p className="text-xs text-violet-700">
                <span className="font-bold">Note:</span> The signatory's name and designation will appear at the bottom of all generated documents (Offer Letter, Experience, Relieving).
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Branding / Assets ── */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <SectionHeader
            gradient="from-rose-500 to-pink-700"
            icon={Image}
            title="Company Branding"
            subtitle="Logo, signature image and official stamp for documents"
          />
          <div className="bg-rose-50 p-5">
            <div className="grid md:grid-cols-3 gap-4">
              <ImageUpload
                label="Company Logo"
                name="logo"
                icon={Building2}
                color="border-blue-300"
                gradient="from-blue-500 to-blue-700"
                preview={previews.logo}
                onChange={onFile}
                onClear={() => clearFile('logo')}
              />
              <ImageUpload
                label="Signature"
                name="signature"
                icon={PenTool}
                color="border-violet-300"
                gradient="from-violet-500 to-purple-700"
                preview={previews.signature}
                onChange={onFile}
                onClear={() => clearFile('signature')}
              />
              <ImageUpload
                label="Company Stamp"
                name="stamp"
                icon={Hash}
                color="border-rose-300"
                gradient="from-rose-500 to-pink-700"
                preview={previews.stamp}
                onChange={onFile}
                onClear={() => clearFile('stamp')}
              />
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs text-rose-700">
              <div className="bg-rose-100 rounded-xl p-3 border border-rose-200">
                <p className="font-bold mb-1">Logo Tips</p>
                <p>Appears in the header of all documents. Recommended: transparent PNG, min 200×200px.</p>
              </div>
              <div className="bg-rose-100 rounded-xl p-3 border border-rose-200">
                <p className="font-bold mb-1">Signature Tips</p>
                <p>Scanned signature on white/transparent background. Appears above signatory name.</p>
              </div>
              <div className="bg-rose-100 rounded-xl p-3 border border-rose-200">
                <p className="font-bold mb-1">Stamp Tips</p>
                <p>Official company seal/stamp. Use transparent PNG for best results.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview Bar ── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Summary Preview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Company', value: form.name || '—', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'City', value: [form.city, form.state].filter(Boolean).join(', ') || '—', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: 'GST', value: form.gst_no || '—', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Doc Prefix', value: form.doc_number_prefix ? `${form.doc_number_prefix}/OFR/2026/0001` : '—', color: 'bg-violet-50 text-violet-700 border-violet-200' },
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
            style={{ background: 'linear-gradient(135deg, #1e40af, #4f46e5, #7c3aed)' }}>
            {saving ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : id ? 'Update Company' : 'Create Company'}
          </button>
          <button type="button" onClick={() => nav('/companies')}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 shadow transition">
            <ArrowLeft size={18} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
