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
  Bell,
  Shield,
  X,
  Home,
  TrendingUp
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import logo from "../../../assets/uni_logo.png";

const HeaderMiddle = () => {
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { user, isAuthenticated, logout } = useAuth();

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
      await logout();
      setIsAccountMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileClick = () => {
    if (isAuthenticated()) {
      setIsAccountMenuOpen(!isAccountMenuOpen);
    } else {
      navigate("/login");
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

  const quickSearchTerms = ["Laptops", "Textbooks", "Furniture", "Electronics", "Dorm Essentials"];

  // Account dropdown menu items
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

  // Mobile navigation items
  const mobileNavItems = [
    { label: "Home", icon: <Home className="w-5 h-5" />, path: "/" },
    { label: "Trending", icon: <TrendingUp className="w-5 h-5" />, path: "/trending" },
    { label: "Categories", icon: <Package className="w-5 h-5" />, path: "/categories" },
  ];

  return (
    <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 flex-shrink-0"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center">
              <img 
                src={logo} 
                alt="UniMarket Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="block text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                UniMarket
              </span>
              <span className="block text-xs text-gray-500 font-medium">
                Campus Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
            <form onSubmit={handleSearch} className="w-full relative">
              <div className={`flex items-center w-full rounded-xl transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-teal-500 bg-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="pl-4">
                  <Search className="w-5 h-5 text-gray-400" />
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
                  className="m-1.5 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                >
                  Search
                </button>
              </div>

              {/* Search Suggestions */}
              {isSearchFocused && search.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">Popular Searches</p>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2">
                    {quickSearchTerms.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickSearch(term)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium transition-colors hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Search className="w-4 h-4" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Wishlist */}
            {isAuthenticated() && (
              <Link 
                to="/wishlist" 
                className="hidden lg:flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 group relative transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
                <span className="text-sm font-medium text-gray-700 hidden lg:block">Wishlist</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Link>
            )}

            {/* Cart */}
            {isAuthenticated() && (
              <Link 
                to="/cart" 
                className="hidden lg:flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 group relative transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
                <span className="text-sm font-medium text-gray-700 hidden lg:block">Cart</span>
                <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  2
                </span>
              </Link>
            )}

            {/* User Profile / Account Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              {isAuthenticated() ? (
                <>
                  <button 
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 transition-all"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.firstName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-teal-600" />
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs text-gray-500">Hello,</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {user?.firstName || "Account"}
                        </p>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isAccountMenuOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </button>

                  {/* Desktop Account Dropdown Menu */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      {/* User Info */}
                      <div className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                            {user?.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.firstName} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-7 h-7 text-teal-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {user?.university}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Sections */}
                      <div className="max-h-96 overflow-y-auto">
                        {accountMenuItems.map((section, idx) => (
                          <div key={idx} className="border-b border-gray-100 last:border-b-0">
                            <div className="px-5 py-3">
                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {section.icon}
                                {section.title}
                              </div>
                            </div>
                            {section.items.map((item, itemIdx) => (
                              <Link
                                key={itemIdx}
                                to={item.path}
                                onClick={() => setIsAccountMenuOpen(false)}
                                className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition-colors group"
                              >
                                <span className="text-gray-400 group-hover:text-teal-600 transition-colors">
                                  {item.icon}
                                </span>
                                <span className="text-sm font-medium group-hover:text-teal-700 transition-colors">
                                  {item.label}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-red-50 text-red-600 hover:from-red-100 hover:to-red-100 rounded-lg font-medium transition-all hover:shadow-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Login/Register buttons for non-authenticated users
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="hidden md:inline-block px-5 py-2.5 text-teal-600 hover:text-teal-700 font-medium hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden py-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors">
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

        {/* Mobile Action Icons */}
        {isAuthenticated() && (
          <div className="md:hidden flex items-center justify-around py-3 border-t border-gray-100">
            <Link 
              to="/wishlist" 
              className="flex flex-col items-center p-2 relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-gray-600" />
              <span className="text-xs mt-1 text-gray-600">Wishlist</span>
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </Link>
            <Link 
              to="/cart" 
              className="flex flex-col items-center p-2 relative"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <span className="text-xs mt-1 text-gray-600">Cart</span>
              <span className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                2
              </span>
            </Link>
            <button 
              onClick={handleProfileClick}
              className="flex flex-col items-center p-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.firstName} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <span className="text-xs mt-1 text-gray-600">Account</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Account Dropdown - MODERNIZED */}
      {isAuthenticated() && isAccountMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Modern Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAccountMenuOpen(false)}
          />
          
          {/* Modern Slide-up Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-all duration-300 animate-in slide-in-from-bottom">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.firstName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-teal-600" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountMenuOpen(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* University Badge */}
            <div className="px-6 pb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                <span className="text-xs font-medium text-teal-700">{user?.university}</span>
              </div>
            </div>

            {/* Menu Items with better spacing */}
            <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
              {accountMenuItems.map((section, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.icon}
                      {section.title}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                          <span className="text-gray-500">{item.icon}</span>
                        </div>
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Logout Button - Sticky at bottom */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-50 to-red-50 text-red-600 hover:from-red-100 hover:to-red-100 rounded-xl font-semibold transition-colors shadow-sm"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl animate-in slide-in-from-left">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center">
                    <img 
                      src={logo} 
                      alt="UniMarket Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <span className="font-bold text-gray-900">Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {isAuthenticated() && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.firstName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.firstName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-1">
              {mobileNavItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderMiddle;