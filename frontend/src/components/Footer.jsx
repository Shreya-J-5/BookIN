import React from 'react';
import { Headphones, ShieldCheck, Mail, Ticket, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#31363F] text-[#CCCCCC] text-xs mt-16">
      {/* Top Value Banner */}
      <div className="border-b border-[#3F444F] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Headphones className="w-8 h-8 text-[#F84464] flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">24/7 CUSTOMER CARE</h4>
                <p className="text-[11px] text-[#999999]">We're here to help with reservations & inquiries.</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Ticket className="w-8 h-8 text-[#F84464] flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">INSTANT CONFIRMATION</h4>
                <p className="text-[11px] text-[#999999]">Digital QR E-Tickets sent straight to your email.</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3">
              <ShieldCheck className="w-8 h-8 text-[#F84464] flex-shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">SECURE PAYMENTS</h4>
                <p className="text-[11px] text-[#999999]">Verified Razorpay 256-bit encrypted checkout.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Links */}
      <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">MOVIES NOW SHOWING</h5>
            <ul className="space-y-1.5 text-[11px] text-[#AAAAAA]">
              <li><Link to="/" className="hover:text-white transition">Dune: Part Two</Link></li>
              <li><Link to="/" className="hover:text-white transition">Oppenheimer</Link></li>
              <li><Link to="/" className="hover:text-white transition">Kalki 2898 AD</Link></li>
              <li><Link to="/" className="hover:text-white transition">Interstellar (Re-Release)</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">CINEMA PARTNERS</h5>
            <ul className="space-y-1.5 text-[11px] text-[#AAAAAA]">
              <li><span className="hover:text-white cursor-pointer transition">PVR INOX</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Cinépolis</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Miraj Cinemas</span></li>
              <li><span className="hover:text-white cursor-pointer transition">MovieMax</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">HELP & LEGAL</h5>
            <ul className="space-y-1.5 text-[11px] text-[#AAAAAA]">
              <li><span className="hover:text-white cursor-pointer transition">About BookIN</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Terms & Conditions</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Cancellation Policy</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">NEWSLETTER</h5>
            <p className="text-[11px] text-[#999999] mb-2">Subscribe to receive exclusive movie ticket deals.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email address"
                className="bg-[#222433] border border-[#3F444F] rounded-l px-3 py-1.5 text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#F84464] flex-1"
              />
              <button
                type="button"
                className="bg-[#F84464] hover:bg-[#E03756] text-white px-3 py-1.5 text-xs font-semibold rounded-r transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Logo & Copyright */}
        <div className="pt-8 mt-8 border-t border-[#3F444F] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#888888]">
          <div className="flex items-center space-x-2">
            <span className="text-base font-black text-white">
              book<span className="text-[#F84464]">in</span>
            </span>
            <span>© 2026 BookIN Entertainment Pvt. Ltd. All Rights Reserved.</span>
          </div>
          <div className="mt-2 sm:mt-0 flex space-x-4">
            <span className="hover:text-white cursor-pointer transition">Sitemap</span>
            <span className="hover:text-white cursor-pointer transition">Security</span>
            <span className="hover:text-white cursor-pointer transition">Contact Us</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
