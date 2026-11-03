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
  Gift,
  HelpCircle
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
          // Put Ahmedabad first if available, else preserve list
          const fetched = data.cities;
          const sorted = fetched.includes('Ahmedabad')
            ? ['Ahmedabad', ...fetched.filter((c) => c !== 'Ahmedabad')]
            : fetched;
          setCities(sorted);
        }
      } catch (err) {
        // use default fallback
      }
    }
    fetchCities();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white">
      {/* 1. Main Header Row */}
      <div className="border-b border-[#DADADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-6">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <BookinLogo />
            </Link>

            {/* Central Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-1 sm:mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#888888]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Movies, Events, Plays, Sports and Activities"
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#DADADA] rounded-sm text-xs text-[#202020] placeholder-[#888888] focus:outline-none focus:border-[#D5A936] transition"
                />
              </div>
            </form>

            {/* Right Controls: City Selector, Sign In, Hamburger */}
            <div className="flex items-center space-x-3 sm:space-x-5 flex-shrink-0">
              
              {/* City Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="flex items-center space-x-1 text-xs sm:text-[13px] font-medium text-[#202020] hover:text-[#D5A936] transition py-1"
                >
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                </button>

                {isCityDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-[#DADADA] rounded-sm shadow-card py-2 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider border-b border-[#F5F5F5] mb-1">
                      Select City
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
                              ? 'bg-[#FBF6EA] text-[#D5A936] font-bold'
                              : 'text-[#202020] hover:bg-[#F5F5F5]'
                          }`}
                        >
                          <span>{city}</span>
                          {selectedCity === city && (
                            <span className="text-[10px] text-[#D5A936]">Selected</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sign In / User Profile */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 py-1 px-2 rounded-sm hover:bg-[#F5F5F5] border border-transparent hover:border-[#DADADA] transition text-xs font-semibold text-[#202020]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#D5A936] text-[#202020] flex items-center justify-center text-xs font-bold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden md:inline max-w-[90px] truncate">{user?.fullName?.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-[#666666]" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#DADADA] rounded-sm shadow-card py-1 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-[#F5F5F5]">
                        <p className="font-bold text-[#202020] truncate">{user?.fullName}</p>
                        <p className="text-[10px] text-[#888888] truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/my-bookings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-[#202020] hover:bg-[#FBF6EA] hover:text-[#D5A936] transition"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#D5A936]" />
                        <span>Your Orders</span>
                      </Link>

                      {(isAdmin || isTheatreAdmin) && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-[#202020] hover:bg-[#FBF6EA] hover:text-[#D5A936] transition"
                        >
                          <Shield className="w-3.5 h-3.5 text-[#D5A936]" />
                          <span>Admin Control</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center space-x-2 px-3 py-2 text-[#D5A936] hover:bg-[#FBF6EA] transition border-t border-[#F5F5F5]"
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
                  className="px-3.5 py-1 bg-white hover:bg-[#F5F5F5] border border-[#DADADA] text-[#202020] hover:text-[#D5A936] hover:border-[#D5A936] text-xs font-semibold rounded-sm transition"
                >
                  Sign In
                </button>
              )}

              {/* Hamburger Menu Icon */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1 text-[#202020] hover:text-[#D5A936] transition"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Horizontal Navigation Row */}
      <div className="bg-white border-b border-[#DADADA] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-xs h-9">
            
            {/* Primary Categories (Left) */}
            <div className="flex items-center space-x-6 h-full">
              <Link
                to="/"
                className={`flex items-center h-full border-b-2 transition ${
                  location.pathname === '/'
                    ? 'border-[#D5A936] text-[#D5A936] font-medium'
                    : 'border-transparent text-[#202020] hover:text-[#D5A936]'
                }`}
              >
                Movies
              </Link>
              <Link
                to="/?category=cinemas"
                className="text-[#202020] hover:text-[#D5A936] transition"
              >
                Cinemas
              </Link>
              <div className="flex items-center space-x-1 text-[#202020] hover:text-[#D5A936] cursor-pointer transition">
                <span>Stream</span>
                <span className="px-1 py-0.2 bg-[#D5A936] text-[#202020] text-[8px] font-bold rounded-sm uppercase tracking-wider">
                  NEW
                </span>
              </div>
              <span className="text-[#202020] hover:text-[#D5A936] cursor-pointer transition">Events</span>
              <span className="text-[#202020] hover:text-[#D5A936] cursor-pointer transition">Plays</span>
              <span className="text-[#202020] hover:text-[#D5A936] cursor-pointer transition">Sports</span>
              <span className="text-[#202020] hover:text-[#D5A936] cursor-pointer transition">Activities</span>
            </div>

            {/* Secondary Utility Links (Right) */}
            <div className="flex items-center space-x-5 text-xs text-[#666666]">
              <span className="hover:text-[#202020] cursor-pointer transition">ListYourShow</span>
              <span className="hover:text-[#202020] cursor-pointer transition">Corporates</span>
              <span className="hover:text-[#202020] cursor-pointer transition">Offers</span>
              <span className="hover:text-[#202020] cursor-pointer transition">Gift Cards</span>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Side Drawer Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10">
            {/* Drawer Header in Charcoal */}
            <div className="p-4 bg-[#26343C] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {isAuthenticated ? `Hey, ${user?.fullName?.split(' ')[0]}!` : 'Hey!'}
                </h3>
                <p className="text-[10px] text-[#A2B0B8]">
                  {isAuthenticated ? user?.email : 'Unlock exclusive movie offers & manage tickets'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-white hover:text-[#D5A936] p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sign in prompt inside drawer if guest */}
            {!isAuthenticated && (
              <div className="p-4 border-b border-[#DADADA] bg-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2 bg-[#D5A936] hover:bg-[#C2982B] text-[#202020] text-xs font-bold rounded-sm text-center transition"
                >
                  Login / Register
                </button>
              </div>
            )}

            {/* Drawer Menu List */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-[#F5F5F5] text-xs text-[#202020]">
              <div className="py-2">
                <Link
                  to="/my-bookings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#FBF6EA] hover:text-[#D5A936] transition"
                >
                  <Ticket className="w-4 h-4 text-[#D5A936]" />
                  <span>Your Orders</span>
                </Link>

                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#FBF6EA] cursor-pointer transition">
                  <Film className="w-4 h-4 text-[#666666]" />
                  <span>Stream Library</span>
                </div>

                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#FBF6EA] cursor-pointer transition">
                  <Sparkles className="w-4 h-4 text-[#666666]" />
                  <span>BookIN Rewards</span>
                </div>

                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#FBF6EA] cursor-pointer transition">
                  <Gift className="w-4 h-4 text-[#666666]" />
                  <span>Offers & Gift Cards</span>
                </div>
              </div>

              {(isAdmin || isTheatreAdmin) && (
                <div className="py-2">
                  <Link
                    to="/admin"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#FBF6EA] text-[#D5A936] font-semibold transition"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Control Hub</span>
                  </Link>
                </div>
              )}

              <div className="py-2">
                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#FBF6EA] cursor-pointer transition">
                  <HelpCircle className="w-4 h-4 text-[#666666]" />
                  <span>Help & Support</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            {isAuthenticated && (
              <div className="p-4 border-t border-[#DADADA]">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full py-2 bg-white border border-[#DADADA] text-[#202020] hover:text-[#D5A936] hover:border-[#D5A936] text-xs font-semibold rounded-sm transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
