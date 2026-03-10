import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Search, 
  User, 
  ShoppingCart, 
  Heart, 
  Menu, 
  Laptop, 
  BookOpen, 
  Smartphone,  
  Home,
  Shirt,
  Zap, 
  Sparkles,
  GraduationCap,
  Gift,
  Bell,
  LogIn
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import logo from "../../../assets/uni_logo.png";
import Sidebar from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import AccountDropdown from './MobileAccountMenu';

const HeaderMiddle = () => {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isAuthenticated, loading } = useAuth();

  const isLoggedIn = isAuthenticated;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const handleQuickSearch = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setSearch("");
    setIsSearchFocused(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside search
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      
      // Check if click is outside notification dropdown
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const quickSearchTerms = ["Laptops", "Textbooks", "Furniture", "Electronics", "Dorm Essentials"];

  if (loading) {
    return (
      <div className={`bg-white border-b border-gray-100 transition-all duration-300 top-0 z-50 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="hidden sm:block">
                <div className="w-32 h-5 bg-gray-200 rounded mb-1"></div>
                <div className="w-40 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dropdown-animation {
          animation: dropdownFadeIn 0.2s ease-out forwards;
        }
        
        .z-header { z-index: 50; }
        .z-dropdown { z-index: 60; }
        .z-sidebar { z-index: 70; }
      `}</style>

      <div className={`bg-white border-b border-gray-100 sticky top-0 z-header transition-all duration-300 ${scrolled ? 'shadow-md py-1' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Menu Button + Logo */}
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 hover:scale-110 active:scale-95 relative group"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              <Link to="/" className="flex items-center space-x-3 flex-shrink-0 group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-110"></div>
                
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-teal-500/30">
                    <div className="absolute inset-0 rounded-xl border-2 border-white/30 group-hover:border-white/50 group-hover:scale-110 transition-all duration-500"></div>
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-20 blur-md group-hover:animate-pulse"></div>
                    <img 
                      src={logo} 
                      alt="UniMarket Logo" 
                      className="w-7 h-7 object-contain relative z-10 group-hover:animate-bounce-subtle"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full group-hover:animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full group-hover:animate-ping animation-delay-300"></div>
                </div>

                <div className="hidden sm:block">
                  <div className="relative overflow-hidden">
                    <span className="block text-2xl font-black bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent group-hover:from-teal-500 group-hover:via-cyan-500 group-hover:to-teal-500 transition-all duration-500 relative z-10">
                      UniMarket
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-600 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5 group-hover:text-teal-600 transition-colors duration-300">
                    <GraduationCap className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-medium tracking-wide">Campus Marketplace</span>
                    <span className="w-1 h-1 bg-teal-400 rounded-full group-hover:animate-pulse"></span>
                  </span>
                </div>

                <span className="sm:hidden relative flex items-center gap-2">
                  <span className="relative">
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-teal-400 rounded-full group-hover:animate-ping"></span>
                  </span>
                  <span className="relative">
                    <span className="text-xl font-black bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent group-hover:from-teal-500 group-hover:via-cyan-500 group-hover:to-teal-500 transition-all duration-500">
                      UniMarket
                    </span>
                    <span className="absolute -inset-1 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></span>
                    <span className="absolute -bottom-1.5 left-0 w-full h-0.5 overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
                      <span className="absolute -top-1 left-1/4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></span>
                    </span>
                  </span>
                </span>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="w-full relative">
                <div className={`flex items-center w-full rounded-2xl transition-all duration-300 ${
                  isSearchFocused 
                    ? 'ring-2 ring-teal-500 bg-white shadow-2xl scale-[1.02] border-transparent' 
                    : 'bg-gray-100/80 hover:bg-gray-100 hover:shadow-lg border border-gray-200/50'
                }`}>
                  <div className="pl-5">
                    <div className={`p-1.5 rounded-full transition-all duration-300 ${
                      isSearchFocused ? 'bg-teal-50' : ''
                    }`}>
                      <Search className={`w-5 h-5 transition-all duration-300 ${
                        isSearchFocused ? 'text-teal-600 scale-110' : 'text-gray-500'
                      }`} />
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full py-3.5 px-3 bg-transparent outline-none text-gray-700 placeholder-transparent"
                    id="search-input"
                  />
                  
                  <label 
                    htmlFor="search-input"
                    className={`absolute left-14 pointer-events-none flex items-center gap-2 transition-all duration-300 ${
                      isSearchFocused || search.length > 0 
                        ? 'opacity-0 -translate-y-4' 
                        : 'opacity-100 translate-y-0 text-gray-400'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="flex -space-x-1">
                        <Laptop className="w-4 h-4" />
                        <BookOpen className="w-4 h-4" />
                        <Smartphone className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-medium">Search campus deals...</span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="m-1.5 p-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 relative overflow-hidden group"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  </button>
                </div>

                {/* Search Suggestions */}
                {isSearchFocused && search.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-dropdown dropdown-animation">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-teal-50/50 via-cyan-50/50 to-teal-50/50">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                        <span>Trending on Campus</span>
                      </p>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {quickSearchTerms.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickSearch(term)}
                          className="flex items-center gap-3 p-3 bg-gray-50/80 hover:bg-gradient-to-r hover:from-teal-500 hover:to-cyan-500 hover:text-white rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group/term relative overflow-hidden"
                        >
                          <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 group-hover/term:bg-white/20 group-hover/term:text-white transition-all duration-200">
                            {term === "Laptops" && <Laptop className="w-4 h-4" />}
                            {term === "Textbooks" && <BookOpen className="w-4 h-4" />}
                            {term === "Furniture" && <Home className="w-4 h-4" />}
                            {term === "Electronics" && <Smartphone className="w-4 h-4" />}
                            {term === "Dorm Essentials" && <Gift className="w-4 h-4" />}
                          </span>
                          <span className="relative z-10">{term}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/term:translate-x-[100%] transition-transform duration-700"></div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-4 pt-0 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        Popular Categories
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["Electronics", "Books", "Furniture", "Clothing"].map((cat, i) => (
                          <span key={i} className="px-3 py-1.5 bg-gray-100/80 rounded-lg text-xs text-gray-600 flex items-center gap-1">
                            {i === 0 && <Smartphone className="w-3 h-3" />}
                            {i === 1 && <BookOpen className="w-3 h-3" />}
                            {i === 2 && <Home className="w-3 h-3" />}
                            {i === 3 && <Shirt className="w-3 h-3" />}
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Section - Desktop & Mobile */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Cart - Always visible on all screens */}
              <Link 
                to="/cart" 
                className="relative p-2 rounded-lg hover:bg-gray-50 group transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-all duration-300" />
                {isLoggedIn && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    2
                  </span>
                )}
              </Link>

              {/* Account Dropdown Component - Always visible on all screens */}
              <AccountDropdown />

              {/* Wishlist - Hide on mobile, show on desktop */}
              {isLoggedIn && (
                <Link 
                  to="/wishlist" 
                  className="relative p-2 rounded-lg hover:bg-gray-50 group transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:block"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-all duration-300" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </Link>
              )}

              {/* Notifications - Hide on mobile, show on desktop */}
              {isLoggedIn && (
                <div className="relative hidden sm:block" ref={notificationRef}>
                  <NotificationDropdown 
                    isOpen={isNotificationOpen}
                    onToggle={() => setIsNotificationOpen(!isNotificationOpen)}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Section - Only visible on mobile */}
          <div className="lg:hidden">
            {/* Mobile Search - Full width on mobile */}
            <div className="py-3 border-t border-gray-100" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 hover:bg-gray-100 transition-all duration-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search products..."
                    className="flex-1 ml-3 py-2 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
                  />
                  {search && (
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors flex-shrink-0"
                    >
                      Search
                    </button>
                  )}
                </div>

                {/* Mobile Search Suggestions */}
                {isSearchFocused && search.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-dropdown">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500">Quick Search</p>
                    </div>
                    <div className="p-2">
                      {quickSearchTerms.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickSearch(term)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {term === "Laptops" && <Laptop className="w-4 h-4 text-teal-600" />}
                          {term === "Textbooks" && <BookOpen className="w-4 h-4 text-teal-600" />}
                          {term === "Furniture" && <Home className="w-4 h-4 text-teal-600" />}
                          {term === "Electronics" && <Smartphone className="w-4 h-4 text-teal-600" />}
                          {term === "Dorm Essentials" && <Gift className="w-4 h-4 text-teal-600" />}
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Mobile Bottom Action Row - Only visible on mobile */}
            <div className="flex items-center justify-between gap-2 pb-3">
              {/* Wishlist - Mobile */}
              {isLoggedIn ? (
                <Link 
                  to="/wishlist" 
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors relative"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Wishlist</span>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <LogIn className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-medium text-gray-700">Sign In</span>
                </Link>
              )}

              {/* Notifications / Join Free - Mobile */}
              {isLoggedIn ? (
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Alerts</span>
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </button>
              ) : (
                <Link 
                  to="/register" 
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-colors shadow-md"
                >
                  <span className="text-sm font-semibold">Join Free</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={() => {}}
      />
    </>
  );
};

export default HeaderMiddle;