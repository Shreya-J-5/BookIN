import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, ShieldCheck } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, register, selectedCity } = useAuth();
  const [mode, setMode] = useState(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
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
        await register({ email, password, fullName, phone, city: selectedCity, role: 'CUSTOMER' });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 transition-opacity animate-fade-in">
      <div className="relative w-full max-w-sm bg-white border border-[#E5E5E5] rounded-lg shadow-2xl p-6 text-[#222222]">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-[#888888] hover:text-[#222222] rounded hover:bg-[#F5F5F5] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1 mb-1">
            <span className="text-2xl font-black tracking-tight text-[#222222]">
              book<span className="text-[#F84464]">in</span>
            </span>
            <div className="w-2 h-2 rounded-full bg-[#F84464]" />
          </div>
          <p className="text-xs text-[#666666]">
            {mode === 'login' ? 'Sign in to access your bookings & tickets' : 'Create an account to book movie tickets'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E5E5E5] mb-5">
          <button
            type="button"
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition ${
              mode === 'login'
                ? 'border-[#F84464] text-[#F84464]'
                : 'border-transparent text-[#666666] hover:text-[#222222]'
            }`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition ${
              mode === 'register'
                ? 'border-[#F84464] text-[#F84464]'
                : 'border-transparent text-[#666666] hover:text-[#222222]'
            }`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#FFF1F3] border border-[#F84464]/30 rounded text-[#F84464] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[#444444] font-medium mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[#888888]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E5] rounded text-xs text-[#222222] focus:outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#444444] font-medium mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#888888]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E5] rounded text-xs text-[#222222] focus:outline-none focus:border-[#F84464]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[#444444] font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#888888]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E5] rounded text-xs text-[#222222] focus:outline-none focus:border-[#F84464]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#444444] font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#888888]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E5] rounded text-xs text-[#222222] focus:outline-none focus:border-[#F84464]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#F84464] hover:bg-[#E03756] text-white font-bold rounded text-xs transition shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Continue' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-5 pt-4 border-t border-[#E5E5E5]">
          <p className="text-[10px] text-[#888888] font-semibold uppercase tracking-wider mb-2">
            One-Click Demo Fill:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('customer')}
              className="py-1 px-1.5 bg-[#F5F5F5] hover:bg-[#EEEEEE] border border-[#E5E5E5] rounded text-[11px] font-medium text-[#444444] transition"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-1 px-1.5 bg-[#F5F5F5] hover:bg-[#EEEEEE] border border-[#E5E5E5] rounded text-[11px] font-medium text-amber-700 transition"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('theatre')}
              className="py-1 px-1.5 bg-[#F5F5F5] hover:bg-[#EEEEEE] border border-[#E5E5E5] rounded text-[11px] font-medium text-sky-700 transition"
            >
              Theatre
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
