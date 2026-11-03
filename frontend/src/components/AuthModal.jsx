import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, ShieldCheck } from 'lucide-react';
import { BookinLogo } from './BookinLogo';

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
      <div className="relative w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl shadow-dropdown p-6 text-[#1E232A]">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-[#94A3B8] hover:text-[#1E232A] rounded-full hover:bg-[#F8F9FA] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <BookinLogo size="default" />
          <p className="text-xs text-[#64748B] mt-2">
            {mode === 'login' ? 'Sign in to access your bookings & tickets' : 'Create an account to book movie tickets'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E2E8F0] mb-5">
          <button
            type="button"
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition ${
              mode === 'login'
                ? 'border-[#E5B642] text-[#E5B642]'
                : 'border-transparent text-[#64748B] hover:text-[#1E232A]'
            }`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition ${
              mode === 'register'
                ? 'border-[#E5B642] text-[#E5B642]'
                : 'border-transparent text-[#64748B] hover:text-[#1E232A]'
            }`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] mb-1">Mobile Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-[#1E232A] focus:outline-none focus:border-[#E5B642] focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold rounded-lg text-xs transition disabled:opacity-50 mt-1 shadow-sm"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In to BookIN' : 'Create Free Account'}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Quick Demo Login</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#E5B642]" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => fillDemo('customer')}
              className="px-2 py-1.5 bg-[#F8F9FA] hover:bg-[#FEF9EE] border border-[#E2E8F0] hover:border-[#E5B642] rounded-md font-semibold text-[#1E232A] transition"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="px-2 py-1.5 bg-[#F8F9FA] hover:bg-[#FEF9EE] border border-[#E2E8F0] hover:border-[#E5B642] rounded-md font-semibold text-[#1E232A] transition"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('theatre')}
              className="px-2 py-1.5 bg-[#F8F9FA] hover:bg-[#FEF9EE] border border-[#E2E8F0] hover:border-[#E5B642] rounded-md font-semibold text-[#1E232A] transition"
            >
              Theatre Mgr
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
