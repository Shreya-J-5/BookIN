import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Film, Shield, User, Lock, Mail, Phone, MapPin } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register } = useAuth();
  const [mode, setMode] = useState(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, fullName, phone, city, role });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type) => {
    setMode('login');
    setError('');
    if (type === 'admin') {
      setEmail('admin@bookin.com');
      setPassword('Admin@BookIN2026!');
    } else if (type === 'theatre') {
      setEmail('theatre@bookin.com');
      setPassword('Theatre@123');
    } else {
      setEmail('customer@bookin.com');
      setPassword('Customer@123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#161922] border border-[#242938] rounded-2xl shadow-2xl p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-900/40">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Book<span className="text-rose-500">IN</span></h2>
            <p className="text-xs text-slate-400">Your portal to cinematic blockbusters</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#242938] mb-6">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold border-b-2 transition ${
              mode === 'login'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold border-b-2 transition ${
              mode === 'register'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aryan Khan"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-sm focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-sm focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-sm focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0c0e14] border border-[#242938] rounded-xl text-sm focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-rose-900/30 disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Credentials helper */}
        <div className="mt-6 pt-5 border-t border-[#242938]">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2.5">
            Quick Fill Demo Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('customer')}
              className="py-1.5 px-2 bg-[#0c0e14] border border-[#242938] rounded-lg text-xs font-medium text-slate-300 hover:border-rose-500 hover:text-white transition"
            >
              👤 Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="py-1.5 px-2 bg-[#0c0e14] border border-[#242938] rounded-lg text-xs font-medium text-amber-400 hover:border-amber-500 transition"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('theatre')}
              className="py-1.5 px-2 bg-[#0c0e14] border border-[#242938] rounded-lg text-xs font-medium text-sky-400 hover:border-sky-500 transition"
            >
              🏢 Theatre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
