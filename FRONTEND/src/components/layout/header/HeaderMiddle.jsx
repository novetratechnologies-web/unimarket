// components/HeaderMiddle.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Search, 
  User, 
  ShoppingCart, 
  Heart, 
  Menu, 
  LogOut, 
  Settings, 
  UserCircle,
  Package,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  Bell,
  Shield,
  X,
  Home,
  TrendingUp,
  Store,
  Sparkles,
  GraduationCap,
  Headphones,
  Phone,
  MapPin
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import logo from "../../../assets/uni_logo.png";
import MobileAccountMenu from './MobileAccountMenu';
import Sidebar from './Sidebar'; // Import the new sidebar

const HeaderMiddle = () => {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isAuthenticated, logout, loading } = useAuth();

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

  const handleLogout = async () => {
    try {
      setIsAccountMenuOpen(false);
      setIsMobileMenuOpen(false);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  const quickSearchTerms = ["Laptops", "Textbooks", "Furniture", "Electronics", "Dorm Essentials"];

  const accountMenuItems = [
    {
      title: "My Account",
      icon: <UserCircle className="w-5 h-5" />,
      items: [
        { label: "Profile", icon: <User className="w-4 h-4" />, path: "/profile" },
        { label: "My Listings", icon: <Package className="w-4 h-4" />, path: "/my-listings" },
        { label: "Orders", icon: <ShoppingBag className="w-4 h-4" />, path: "/orders" },
        { label: "Messages", icon: <MessageSquare className="w-4 h-4" />, path: "/messages" },
      ]
    },
    {
      title: "Settings",
      icon: <Settings className="w-5 h-5" />,
      items: [
        { label: "Account Settings", icon: <Settings className="w-4 h-4" />, path: "/settings" },
        { label: "Payment Methods", icon: <CreditCard className="w-4 h-4" />, path: "/payment" },
        { label: "Notifications", icon: <Bell className="w-4 h-4" />, path: "/notifications" },
        { label: "Security", icon: <Shield className="w-4 h-4" />, path: "/security" },
      ]
    },
    {
      title: "Help & Support",
      icon: <HelpCircle className="w-5 h-5" />,
      items: [
        { label: "Help Center", icon: <HelpCircle className="w-4 h-4" />, path: "/help" },
        { label: "Contact Support", icon: <MessageSquare className="w-4 h-4" />, path: "/contact" },
        { label: "Terms & Privacy", icon: <Shield className="w-4 h-4" />, path: "/terms" },
      ]
    }
  ];

  if (loading) {
    return (
      <div className={`bg-white border-b border-gray-100 transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="hidden sm:block">
                <div className="w-24 h-5 bg-gray-200 rounded mb-1"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
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
      <div className={`bg-white border-b border-gray-100 sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'shadow-md py-1' : 'shadow-sm'}`}>
        {/* Add keyframe animations */}
        <style jsx>{`
          @keyframes dropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .dropdown-animation {
            animation: dropdownFadeIn 0.2s ease-out forwards;
          }
        `}</style>

        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Menu Button (Mobile) + Logo */}
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button with animation */}
              <button
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 hover:scale-110 active:scale-95 relative group"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Toggle menu"
              >
                <Menu className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </button>

              {/* Logo with hover effect */}
              <Link 
                to="/" 
                className="flex items-center space-x-3 flex-shrink-0 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-lg">
                  <img 
                    src={logo} 
                    alt="UniMarket Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="block text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-teal-500 group-hover:to-cyan-500 transition-all duration-300">
                    UniMarket
                  </span>
                  <span className="block text-xs text-gray-500 font-medium flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    Campus Marketplace
                  </span>
                </div>
              </Link>
            </div>

            {/* Search Bar - Desktop with enhanced design */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="w-full relative">
                <div className={`flex items-center w-full rounded-xl transition-all duration-300 ${
                  isSearchFocused 
                    ? 'ring-2 ring-teal-500 bg-white shadow-lg scale-[1.02]' 
                    : 'bg-gray-50 hover:bg-gray-100 hover:shadow-md'
                }`}>
                  <div className="pl-4">
                    <Search className={`w-5 h-5 transition-colors duration-300 ${isSearchFocused ? 'text-teal-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search for textbooks, electronics, furniture..."
                    className="w-full py-3 px-4 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="m-1.5 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Search</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>

                {/* Search Suggestions with animation */}
                {isSearchFocused && search.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 dropdown-animation">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-500" />
                        Popular Searches
                      </p>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {quickSearchTerms.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickSearch(term)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 text-gray-700 hover:text-teal-700 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 group"
                        >
                          <Search className="w-4 h-4 group-hover:text-teal-500 transition-colors" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Section - User Actions with enhanced design */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Wishlist with animation */}
              {isLoggedIn && (
                <Link 
                  to="/wishlist" 
                  className="relative p-2 rounded-lg hover:bg-gray-50 group transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-all duration-300 group-hover:fill-red-500" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </Link>
              )}

              {/* Cart with animation */}
              {isLoggedIn && (
                <Link 
                  to="/cart" 
                  className="relative p-2 rounded-lg hover:bg-gray-50 group transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-all duration-300 group-hover:rotate-12" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    2
                  </span>
                </Link>
              )}

              {/* User Profile with enhanced design */}
              <div className="relative" ref={accountMenuRef}>
                {isLoggedIn ? (
                  <>
                    <button 
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-all duration-200 hover:scale-105 active:scale-95 group"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm group-hover:ring-4 group-hover:ring-teal-100 transition-all duration-300">
                          {user?.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user?.firstName || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-xs text-gray-500">Hello,</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 transition-colors">
                            {user?.firstName || "Account"}
                          </p>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 ${isAccountMenuOpen ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </button>

                    {/* Desktop Dropdown with fixed animation */}
                    {isAccountMenuOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
                        style={{
                          animation: 'dropdownFadeIn 0.2s ease-out forwards',
                          transformOrigin: 'top'
                        }}
                      >
                        <div className="p-5 bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                                {user?.avatar ? (
                                  <img 
                                    src={user.avatar} 
                                    alt={user?.firstName || 'User'} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-7 h-7 text-teal-600" />
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {accountMenuItems.map((section, idx) => (
                            <div key={idx} className="border-b border-gray-100 last:border-b-0">
                              <div className="px-5 py-3 bg-gray-50/50">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  <span className="text-teal-600">{section.icon}</span>
                                  {section.title}
                                </div>
                              </div>
                              {section.items.map((item, itemIdx) => (
                                <button
                                  key={itemIdx}
                                  onClick={() => {
                                    setIsAccountMenuOpen(false);
                                    navigate(item.path);
                                  }}
                                  className="w-full text-left flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-200 group"
                                >
                                  <span className="text-gray-400 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-200">
                                    {item.icon}
                                  </span>
                                  <span className="text-sm font-medium group-hover:text-teal-700">
                                    {item.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          <button
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 hover:from-red-100 hover:to-rose-100 rounded-lg font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
                          >
                            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="hidden md:inline-block px-4 py-2 text-teal-600 hover:text-teal-700 font-medium hover:bg-teal-50 rounded-lg transition-all duration-200 border border-teal-200 hover:border-teal-300 hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Join Free</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search with enhanced design */}
          <div className="lg:hidden py-3 border-t border-gray-100">
            <form onSubmit={handleSearch}>
              <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 ml-3 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Account Menu - Only shows on mobile */}
      <div className="lg:hidden">
        <MobileAccountMenu
          isOpen={isLoggedIn && isAccountMenuOpen}
          onClose={() => setIsAccountMenuOpen(false)}
          user={user}
          onLogout={handleLogout}
          accountMenuItems={accountMenuItems}
        />
      </div>

      {/* New Sidebar Component */}
      <Sidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
};

export default HeaderMiddle;