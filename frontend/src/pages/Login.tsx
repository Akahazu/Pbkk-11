import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Terminal } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Login
      const data = await apiClient('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      const token = data.access_token;
      if (!token) {
        throw new Error('Access token not received from server');
      }

      // Temporarily set token so /api/user works
      setAuth(token, null, remember);

      // Step 2: Fetch user profile
      let user = null;
      try {
        user = await apiClient('/api/user');
      } catch (err) {
        user = { id: 1, name: 'SOC Analyst', email };
      }

      setAuth(token, user, remember);
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@example.com');
    setPassword('password');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Grid Pattern & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-soc-card border border-soc-border rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-900/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            SOC Analyst AI
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">Security Operations Center LLM Gateway</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 bg-red-950/50 border border-red-900/60 p-3 rounded-xl text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
              Analyst Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#070b14] border border-soc-border rounded-xl px-4 py-3 pl-10 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none transition"
                placeholder="analyst@soc.local"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5">
              Access Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#070b14] border border-soc-border rounded-xl px-4 py-3 pl-10 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 focus:outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded bg-[#070b14] border-soc-border text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Remember session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 text-sm mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Authenticating...
              </span>
            ) : (
              <>
                <span>Access SOC Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill */}
        <div className="mt-6 pt-6 border-t border-soc-border text-center">
          <p className="text-xs text-gray-400 mb-2 font-mono">Demo Environment Credentials:</p>
          <button
            type="button"
            onClick={fillDemo}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs px-3 py-2 rounded-xl transition font-mono"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>demo@example.com / password</span>
          </button>
        </div>
      </div>
    </div>
  );
}
