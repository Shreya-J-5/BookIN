import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, MapPin, Search, Ticket, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { graphqlRequest } from '../services/graphqlClient';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isTheatreAdmin, selectedCity, setSelectedCity, logout, openAuthModal } = useAuth();
  const [cities, setCities] = useState(['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Pune', 'Kolkata']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCities() {
      try {
        const data = await graphqlRequest('query { cities }');
        if (data?.cities?.length) {
          setCities(data.cities);
        }
      } catch (err) {
        // fallback to default
      }
    }
    fetchCities();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#0c0e14]/90 backdrop-blur-md border-b border-[#242938]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & City */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Book<span className="text-rose-500">IN</span>
              </span>
            </Link>

            {/* City Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCityOpen(!isCityOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#161922] border border-[#242938] text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isCityOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-[#161922] border border-[#242938] rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Your City
                  </div>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsCityOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition ${
                        selectedCity === city
                          ? 'bg-rose-500/10 text-rose-500 font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Movies, Theatres, or Genres..."
                className="w-full pl-10 pr-4 py-2 bg-[#161922] border border-[#242938] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </form>

          {/* Nav links and Auth */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-300 hover:text-white transition px-2 py-1"
            >
              Movies
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 hover:text-white transition px-2 py-1"
              >
                <Ticket className="w-3.5 h-3.5 text-rose-500" />
                <span>My Tickets</span>
              </Link>
            )}

            {(isAdmin || isTheatreAdmin) && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Hub</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 bg-[#161922] border border-[#242938] rounded-xl text-xs font-medium text-white hover:border-slate-600 transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-xs font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user?.fullName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#161922] border border-[#242938] rounded-xl shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-[#242938]">
                      <p className="font-semibold text-white">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] rounded font-semibold">
                        {user?.roles?.[0] || 'CUSTOMER'}
                      </span>
                    </div>

                    <Link
                      to="/my-bookings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <Ticket className="w-4 h-4 text-rose-500" />
                      <span>My Bookings</span>
                    </Link>

                    {(isAdmin || isTheatreAdmin) && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 transition border-t border-[#242938]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/30 transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
