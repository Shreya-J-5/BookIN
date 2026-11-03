import React from 'react';
import { Film, ShieldCheck, Heart, Sparkles, CreditCard, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#08090d] border-t border-[#1e2230] text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-[#1e2230]">
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-[#161922] border border-[#242938]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Collision-Free</h4>
              <p className="text-xs text-slate-400 mt-0.5">PostgreSQL row-level transactional locks guarantee zero double-bookings.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-[#161922] border border-[#242938]">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Real-Time Sync</h4>
              <p className="text-xs text-slate-400 mt-0.5">WebSockets reflect instant seat occupancy across all devices live.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-[#161922] border border-[#242938]">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Verified Checkout</h4>
              <p className="text-xs text-slate-400 mt-0.5">Cryptographic Razorpay HMAC SHA256 payment verification.</p>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-base tracking-tight">Book<span className="text-rose-500">IN</span></span>
            <span>© 2026 BookIN Movie Ticket Booking Platform. Built with React & GraphQL.</span>
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="hover:text-slate-300 transition">Privacy Policy</span>
            <span className="hover:text-slate-300 transition">Terms of Service</span>
            <span className="hover:text-slate-300 transition">Cancellation Policy</span>
            <span className="hover:text-slate-300 transition">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
