import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FileText } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@docsoft.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
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
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-700 p-3 rounded-xl"><FileText className="text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">DocSoft</h1>
            <p className="text-sm text-gray-500">Multi-Company Document Generator</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Default: admin@docsoft.com / admin123
        </p>
      </div>
    </div>
  );
}
