import React from 'react';
import { Link } from 'react-router-dom';
import { BookinLogo } from './BookinLogo';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { selectedCity } = useAuth();

  return (
    <footer className="bg-[#1E232A] text-white/70 text-xs mt-16 border-t border-[#2B323C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Description */}
          <div>
            <BookinLogo variant="dark" size="default" />
            <p className="text-xs text-white/60 mt-3 leading-relaxed">
              Book your movie tickets, discover cinemas, and enjoy seamless seat reservations across India.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Explore</h5>
            <ul className="space-y-2 text-xs text-white/70">
              <li><Link to="/" className="hover:text-[#E5B642] transition">Movies</Link></li>
              <li><Link to="/?category=cinemas" className="hover:text-[#E5B642] transition">Cinemas & Multiplexes</Link></li>
              <li><span className="hover:text-[#E5B642] cursor-pointer transition">Live Events</span></li>
              <li><span className="hover:text-[#E5B642] cursor-pointer transition">Sports & Tournaments</span></li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Legal */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Support</h5>
            <ul className="space-y-2 text-xs text-white/70">
              <li><span className="hover:text-[#E5B642] cursor-pointer transition">Help & FAQs</span></li>
              <li><span className="hover:text-[#E5B642] cursor-pointer transition">Terms & Conditions</span></li>
              <li><span className="hover:text-[#E5B642] cursor-pointer transition">Privacy Policy</span></li>
              <li><span className="hover:text-[#E5B642] cursor-pointer transition">Cancellation Policy</span></li>
            </ul>
          </div>

          {/* Column 4: Connection in selected city */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Location</h5>
            <p className="text-xs text-white/60 leading-relaxed mb-3">
              Currently discovering shows in <span className="text-[#E5B642] font-semibold">{selectedCity || 'Ahmedabad'}</span>. Instant tickets delivered via QR pass.
            </p>
            <div className="flex space-x-3 text-xs text-white/60">
              <span className="hover:text-[#E5B642] cursor-pointer transition">Facebook</span>
              <span>•</span>
              <span className="hover:text-[#E5B642] cursor-pointer transition">Twitter</span>
              <span>•</span>
              <span className="hover:text-[#E5B642] cursor-pointer transition">Instagram</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-[#2B323C] flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 gap-4">
          <p>© 2026 BookIN Entertainment Pvt. Ltd. All rights reserved.</p>
          <div className="flex space-x-4">
            <span className="hover:text-white cursor-pointer transition">Security</span>
            <span className="hover:text-white cursor-pointer transition">Sitemap</span>
            <span className="hover:text-white cursor-pointer transition">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
