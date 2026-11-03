import React from 'react';
import { Link } from 'react-router-dom';
import { BookinLogo } from './BookinLogo';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { selectedCity } = useAuth();

  return (
    <footer className="bg-[#26343C] text-[#A2B0B8] text-xs mt-16 border-t border-[#3A4C57]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: BookIN / About */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Footer</h5>
            <ul className="space-y-1.5 text-xs text-[#A2B0B8]">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><span className="hover:text-white cursor-pointer transition">About Us</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Terms of Service</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Privacy Policy</span></li>
            </ul>
          </div>

          {/* Column 2: Events & Cinemas */}
          <div>
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Events</h5>
            <ul className="space-y-1.5 text-xs text-[#A2B0B8]">
              <li><span className="hover:text-white cursor-pointer transition">Cinemas & Multiplexes</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Live Music & Plays</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Sports & Gaming</span></li>
              <li><span className="hover:text-white cursor-pointer transition">Special Screenings</span></li>
            </ul>
          </div>

          {/* Column 3: Connection & Discovery */}
          <div className="sm:col-span-2 md:col-span-2">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Connection</h5>
            <p className="text-xs text-[#A2B0B8] mb-3 leading-relaxed">
              Discover the latest releases and showtimes in <span className="text-white font-semibold">{selectedCity || 'your city'}</span>. Book tickets instantly with real-time seat locks and secure payment processing.
            </p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="hover:text-white cursor-pointer transition">Contact Us</span>
              <span className="text-[#4E626D]">|</span>
              <span className="hover:text-white cursor-pointer transition">Help & FAQs</span>
              <span className="text-[#4E626D]">|</span>
              <span className="hover:text-white cursor-pointer transition">Partner With Us</span>
            </div>
          </div>

        </div>

        {/* Bottom Logo & Copyright */}
        <div className="pt-8 mt-8 border-t border-[#3A4C57] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7E909A] gap-4">
          <BookinLogo variant="dark" size="small" />
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
