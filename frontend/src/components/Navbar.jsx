import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookinLogo } from './BookinLogo';
import {
  Search,
  ChevronDown,
  Menu,
  X,
  Ticket,
  Shield,
  LogOut,
  User,
  Film,
  Sparkles,
  MapPin
} from 'lucide-react';
import { graphqlRequest } from '../services/graphqlClient';

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isTheatreAdmin,
    selectedCity,
    setSelectedCity,
    logout,
    openAuthModal
  } = useAuth();

  const [cities, setCities] = useState([
    'Ahmedabad', 'Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Chandigarh', 'Chennai', 'Pune', 'Kolkata'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchCities() {
      try {
        const data = await graphqlRequest('query { cities }');
        if (data?.cities?.length) {
          const fetched = data.cities;
          const sorted = fetched.includes('Ahmedabad')
            ? ['Ahmedabad', ...fetched.filter((c) => c !== 'Ahmedabad')]
            : fetched;
          setCities(sorted);
        }
      } catch (err) {
        // fallback
      }
    }
    fetchCities();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    } else {
      navigate('/');
    }
  };

  const handleBookNowClick = () => {
    const movieSection = document.getElementById('movie-discovery-section');
    if (movieSection) {
      movieSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1E232A] text-white border-b border-[#2B323C] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Left: BookIN Logo (White monogram + White BOOK + Gold IN) */}
          <Link to="/" className="flex items-center flex-shrink-0 group">
            <BookinLogo variant="dark" size="default" />
          </Link>

          {/* Centre: Navigation Links (Exact from reference) */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link
              to="/"
              className={`transition ${
                location.pathname === '/' && !location.search
                  ? 'text-[#E5B642] font-semibold'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Movies
            </Link>
            <Link
              to="/?category=cinemas"
              className="text-white/80 hover:text-white transition"
            >
              Cinemas
            </Link>
            <span
              onClick={handleBookNowClick}
              className="text-white/80 hover:text-white cursor-pointer transition"
            >
              Events
            </span>
            <span
              onClick={handleBookNowClick}
              className="text-white/80 hover:text-white cursor-pointer transition"
            >
              Sports
            </span>
          </nav>

          {/* Right: Search, City Selector, Profile/Sign In & Gold 'Book Now' Button */}
          <div className="flex items-center space-x-3 sm:space-x-5 flex-shrink-0">
            
            {/* Search Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#2B323C] border border-[#3E4756] rounded-full px-3 py-1.5 w-64 z-20">
                  <Search className="w-3.5 h-3.5 text-white/50 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies..."
                    className="bg-transparent text-xs text-white placeholder-white/50 focus:outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-white/50 hover:text-white ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/5 transition"
                  title="Search movies"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City Selector Dropdown */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="flex items-center space-x-1 text-xs font-medium text-white/80 hover:text-white transition py-1"
              >
                <span>{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
              </button>

              {isCityDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1E232A] border border-[#333C48] rounded-md shadow-dropdown py-2 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-white/50 uppercase tracking-wider border-b border-[#2B323C] mb-1">
                    Select Location
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center justify-between ${
                          selectedCity === city
                            ? 'bg-[#2B323C] text-[#E5B642] font-bold'
                            : 'text-white/80 hover:bg-[#262C35] hover:text-white'
                        }`}
                      >
                        <span>{city}</span>
                        {selectedCity === city && (
                          <span className="text-[10px] text-[#E5B642]">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Sign In Link */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 py-1 px-2 rounded-full hover:bg-white/10 transition text-xs font-semibold text-white"
                >
                  <div className="w-7 h-7 rounded-full bg-[#E5B642] text-[#1E232A] flex items-center justify-center text-xs font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden lg:inline max-w-[80px] truncate">{user?.fullName?.split(' ')[0]}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1E232A] border border-[#333C48] rounded-md shadow-dropdown py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-[#2B323C]">
                      <p className="font-bold text-white truncate">{user?.fullName}</p>
                      <p className="text-[10px] text-white/50 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/my-bookings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-white/80 hover:bg-[#2B323C] hover:text-[#E5B642] transition"
                    >
                      <Ticket className="w-3.5 h-3.5 text-[#E5B642]" />
                      <span>Your Orders</span>
                    </Link>

                    {(isAdmin || isTheatreAdmin) && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-white/80 hover:bg-[#2B323C] hover:text-[#E5B642] transition"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#E5B642]" />
                        <span>Admin Hub</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left flex items-center space-x-2 px-3 py-2 text-red-400 hover:bg-[#2B323C] transition border-t border-[#2B323C]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="hidden sm:inline-block text-xs font-medium text-white/80 hover:text-white transition px-2 py-1"
              >
                Sign In
              </button>
            )}

            {/* Gold 'Book Now' Button (Exact from reference) */}
            <button
              type="button"
              onClick={handleBookNowClick}
              className="bg-[#E5B642] hover:bg-[#D4A333] text-[#1E232A] font-bold text-xs sm:text-sm px-5 sm:px-6 py-2 rounded-full transition shadow-sm active:scale-95"
            >
              Book Now
            </button>

            {/* Mobile Hamburger Menu Icon */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 text-white/80 hover:text-white md:hidden transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-xs bg-[#1E232A] h-full shadow-2xl flex flex-col z-10 border-l border-[#2B323C]">
            <div className="p-4 border-b border-[#2B323C] flex items-center justify-between">
              <BookinLogo variant="dark" size="small" />
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-white/70 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#2B323C]">
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">Location</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-[#262C35] border border-[#333C48] rounded px-3 py-1.5 text-xs text-white"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto py-2 divide-y divide-[#2B323C] text-sm text-white">
              <div className="py-2 space-y-1 px-4">
                <Link
                  to="/"
                  onClick={() => setIsDrawerOpen(false)}
                  className="block py-2 text-white hover:text-[#E5B642]"
                >
                  Movies
                </Link>
                <Link
                  to="/?category=cinemas"
                  onClick={() => setIsDrawerOpen(false)}
                  className="block py-2 text-white hover:text-[#E5B642]"
                >
                  Cinemas
                </Link>
                <span
                  onClick={() => { setIsDrawerOpen(false); handleBookNowClick(); }}
                  className="block py-2 text-white hover:text-[#E5B642] cursor-pointer"
                >
                  Events
                </span>
                <span
                  onClick={() => { setIsDrawerOpen(false); handleBookNowClick(); }}
                  className="block py-2 text-white hover:text-[#E5B642] cursor-pointer"
                >
                  Sports
                </span>
              </div>

              {isAuthenticated ? (
                <div className="py-2 px-4 space-y-2 text-xs">
                  <Link
                    to="/my-bookings"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center space-x-2 py-1.5 text-white/80 hover:text-[#E5B642]"
                  >
                    <Ticket className="w-4 h-4 text-[#E5B642]" />
                    <span>Your Orders</span>
                  </Link>

                  {(isAdmin || isTheatreAdmin) && (
                    <Link
                      to="/admin"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center space-x-2 py-1.5 text-white/80 hover:text-[#E5B642]"
                    >
                      <Shield className="w-4 h-4 text-[#E5B642]" />
                      <span>Admin Hub</span>
                    </Link>
                  )}

                  <button
                    onClick={() => { logout(); setIsDrawerOpen(false); }}
                    className="w-full text-left py-1.5 text-red-400 hover:text-red-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <button
                    onClick={() => { setIsDrawerOpen(false); openAuthModal('login'); }}
                    className="w-full py-2 bg-[#E5B642] text-[#1E232A] font-bold rounded-full text-xs"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
