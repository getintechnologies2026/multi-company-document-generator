import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Sparkles, CreditCard, Award, LogOut,
  TrendingUp, GraduationCap, Layers, Building2,
  Users, CheckCircle, Lock, Mail, Eye, EyeOff, Zap
} from 'lucide-react';

const FEATURES = [
  { icon: Sparkles,        label: 'Offer Letters',              desc: 'Professional joining letters',          color: 'bg-orange-400' },
  { icon: CreditCard,      label: 'Payslips & Bulk Payslips',   desc: 'Monthly salary slips with breakdown',   color: 'bg-emerald-400' },
  { icon: Award,           label: 'Experience Letters',         desc: 'Verified work experience certificates', color: 'bg-amber-400' },
  { icon: LogOut,          label: 'Relieving Letters',          desc: 'Formal exit & clearance letters',       color: 'bg-rose-400' },
  { icon: TrendingUp,      label: 'Increment Letters',          desc: 'Salary revision with CTC breakdown',    color: 'bg-teal-400' },
  { icon: GraduationCap,   label: 'Internship Certificates',    desc: 'Internship completion certificates',    color: 'bg-violet-400' },
  { icon: Layers,          label: 'Generate All at Once',       desc: 'All 5 documents from a single form',    color: 'bg-pink-400' },
  { icon: Building2,       label: 'Multi-Company Support',      desc: 'Manage unlimited companies',            color: 'bg-blue-400' },
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* ── LEFT PANEL — Features ── */}
      <div className="hidden lg:flex lg:w-3/5 flex-col justify-between p-10 relative overflow-hidden">

        {/* Background blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

        {/* Logo & Title */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
              <FileText size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Docs Gen</h1>
              <p className="text-indigo-300 text-sm font-medium">Multi-Company Document Generator</p>
            </div>
          </div>
          <div className="mt-6 mb-2">
            <h2 className="text-4xl font-black text-white leading-tight">
              Generate Professional
              <span className="block" style={{ background: 'linear-gradient(90deg, #818cf8, #ec4899, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Documents Instantly
              </span>
            </h2>
            <p className="text-indigo-300 mt-3 text-base leading-relaxed max-w-md">
              Create offer letters, payslips, experience letters and more — all with your company branding, in seconds.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc, color }) => (
            <div key={label}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-white/10 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className={`${color} p-2 rounded-lg shrink-0 shadow-md`}>
                <Icon size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-tight">{label}</p>
                <p className="text-indigo-300 text-xs mt-0.5 leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-6 pt-4 border-t border-white/10">
          {[
            { icon: Building2, label: 'Multi-Company', color: 'text-blue-400' },
            { icon: Users,     label: 'Role-Based Access', color: 'text-emerald-400' },
            { icon: Zap,       label: 'Instant PDF Export', color: 'text-amber-400' },
            { icon: CheckCircle, label: 'Branded Templates', color: 'text-pink-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={13} className={color} />
              <span className="text-white/60 text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Docs Gen</h1>
              <p className="text-indigo-300 text-xs">Multi-Company Document Generator</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}>

            {/* Card header */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, #6366f1, #ec4899)' }} />
                <div className="w-4 h-1 rounded-full bg-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mt-3">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="px-8 pb-8 space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: loading ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock size={15} />
                    Sign In to Docs Gen
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">SECURED ACCESS</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['Offer Letters', 'Payslips', 'Experience', 'Relieving', 'Increment', 'Internship'].map(f => (
                  <span key={f} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                    {f}
                  </span>
                ))}
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-indigo-300/60 text-xs mt-6">
            © 2026 Docs Gen · Multi-Company Document Generator
          </p>
        </div>
      </div>
    </div>
  );
}
