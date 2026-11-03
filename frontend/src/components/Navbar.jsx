import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  MapPin,
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
  HelpCircle,
  Bell
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
    'Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chandigarh', 'Chennai', 'Pune', 'Kolkata'
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
          setCities(data.cities);
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
    <header className="sticky top-0 z-40 bg-white shadow-bms">
      {/* 1. Main Header */}
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-1.5 flex-shrink-0 group">
              <span className="text-2xl font-black tracking-tight text-[#222222]">
                book<span className="text-[#F84464]">in</span>
              </span>
              <div className="w-2 h-2 rounded-full bg-[#F84464]" />
            </Link>

            {/* Large Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 sm:mx-6">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#888888]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Movies, Events, Plays, Sports and Activities"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E5E5] rounded text-[13px] text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#F84464] transition"
                />
              </div>
            </form>

            {/* Right Side: City, Sign In, Hamburger */}
            <div className="flex items-center space-x-4 sm:space-x-5 flex-shrink-0">
              
              {/* City Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="flex items-center space-x-1 text-[13px] font-medium text-[#222222] hover:text-[#F84464] transition py-1"
                >
                  <span>{selectedCity}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
                </button>

                {isCityDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E5E5] rounded-md shadow-bms-dropdown py-2 z-50 animate-fade-in">
                    <div className="px-3 py-1 text-[11px] font-bold text-[#888888] uppercase tracking-wider border-b border-[#F5F5F5] mb-1">
                      Popular Cities
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
                          className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between ${
                            selectedCity === city
                              ? 'bg-[#FFF1F3] text-[#F84464] font-bold'
                              : 'text-[#333333] hover:bg-[#F9F9F9]'
                          }`}
                        >
                          <span>{city}</span>
                          {selectedCity === city && <span className="text-[10px] text-[#F84464]">Selected</span>}
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
                    className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-[#F5F5F5] transition text-xs font-semibold text-[#222222]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#F84464] text-white flex items-center justify-center text-xs font-bold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden md:inline max-w-[100px] truncate">{user?.fullName?.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 text-[#666666]" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E5E5] rounded-md shadow-bms-dropdown py-1 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-[#F5F5F5]">
                        <p className="font-bold text-[#222222] truncate">{user?.fullName}</p>
                        <p className="text-[11px] text-[#888888] truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/my-bookings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-[#333333] hover:bg-[#F9F9F9] transition"
                      >
                        <Ticket className="w-3.5 h-3.5 text-[#F84464]" />
                        <span>Your Orders</span>
                      </Link>

                      {(isAdmin || isTheatreAdmin) && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-[#333333] hover:bg-[#F9F9F9] transition"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          <span>Admin Control</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center space-x-2 px-3 py-2 text-[#F84464] hover:bg-[#FFF1F3] transition border-t border-[#F5F5F5]"
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
                  className="px-4 py-1.5 bg-[#F84464] hover:bg-[#E03756] text-white text-xs font-semibold rounded transition shadow-sm"
                >
                  Sign In
                </button>
              )}

              {/* Hamburger Menu Icon */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 text-[#444444] hover:text-[#222222] rounded hover:bg-[#F5F5F5] transition"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Secondary Horizontal Navigation */}
      <div className="bg-white border-b border-[#E5E5E5] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-[13px] font-normal h-10">
            
            {/* Primary Categories */}
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className={`transition ${
                  location.pathname === '/' ? 'text-[#F84464] font-medium' : 'text-[#333333] hover:text-[#F84464]'
                }`}
              >
                Movies
              </Link>
              <Link to="/?category=cinemas" className="text-[#333333] hover:text-[#F84464] transition">
                Cinemas
              </Link>
              <div className="flex items-center space-x-1 text-[#333333] hover:text-[#F84464] cursor-pointer transition">
                <span>Stream</span>
                <span className="px-1 py-0.2 bg-[#F84464] text-white text-[9px] font-bold rounded uppercase">
                  NEW
                </span>
              </div>
              <span className="text-[#333333] hover:text-[#F84464] cursor-pointer transition">Events</span>
              <span className="text-[#333333] hover:text-[#F84464] cursor-pointer transition">Plays</span>
              <span className="text-[#333333] hover:text-[#F84464] cursor-pointer transition">Sports</span>
              <span className="text-[#333333] hover:text-[#F84464] cursor-pointer transition">Activities</span>
            </div>

            {/* Secondary Utility Links */}
            <div className="flex items-center space-x-5 text-xs text-[#555555]">
              <span className="hover:text-[#222222] cursor-pointer transition">ListYourShow</span>
              <span className="hover:text-[#222222] cursor-pointer transition">Corporates</span>
              <span className="hover:text-[#222222] cursor-pointer transition">Offers</span>
              <span className="hover:text-[#222222] cursor-pointer transition">Gift Cards</span>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Side Drawer Menu (BookMyShow style Right Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in">
            {/* Drawer Header */}
            <div className="p-4 bg-[#222433] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {isAuthenticated ? `Hey, ${user?.fullName?.split(' ')[0]}!` : 'Hey!'}
                </h3>
                <p className="text-[11px] text-[#AAAAAA]">
                  {isAuthenticated ? user?.email : 'Unlock special offers & manage your bookings'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-white hover:text-slate-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sign in prompt inside drawer if guest */}
            {!isAuthenticated && (
              <div className="p-4 border-b border-[#E5E5E5] bg-[#F9F9F9]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2 bg-[#F84464] hover:bg-[#E03756] text-white text-xs font-semibold rounded text-center transition"
                >
                  Login / Register
                </button>
              </div>
            )}

            {/* Drawer Menu List */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-[#F5F5F5] text-xs text-[#333333]">
              <div className="py-2">
                <Link
                  to="/my-bookings"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#F5F5F5] transition"
                >
                  <Ticket className="w-4 h-4 text-[#F84464]" />
                  <span>Your Orders</span>
                </Link>

                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#F5F5F5] cursor-pointer transition">
                  <Film className="w-4 h-4 text-[#666666]" />
                  <span>Stream Library</span>
                </div>

                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#F5F5F5] cursor-pointer transition">
                  <Bell className="w-4 h-4 text-[#666666]" />
                  <span>Notifications</span>
                </div>
              </div>

              <div className="py-2">
                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#F5F5F5] cursor-pointer transition">
                  <Sparkles className="w-4 h-4 text-[#666666]" />
                  <span>Offers & Coupons</span>
                </div>
                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#F5F5F5] cursor-pointer transition">
                  <Gift className="w-4 h-4 text-[#666666]" />
                  <span>Gift Cards</span>
                </div>
                <div className="flex items-center space-x-3 px-5 py-2.5 hover:bg-[#F5F5F5] cursor-pointer transition">
                  <HelpCircle className="w-4 h-4 text-[#666666]" />
                  <span>Help & Support</span>
                </div>
              </div>

              {(isAdmin || isTheatreAdmin) && (
                <div className="py-2 bg-amber-50/50">
                  <Link
                    to="/admin"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center space-x-3 px-5 py-2.5 text-amber-700 hover:bg-amber-100/60 transition font-semibold"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Admin Dashboard</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Logout button at bottom */}
            {isAuthenticated && (
              <div className="p-4 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full py-2 border border-[#E5E5E5] text-[#F84464] hover:bg-[#FFF1F3] text-xs font-semibold rounded text-center transition"
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
