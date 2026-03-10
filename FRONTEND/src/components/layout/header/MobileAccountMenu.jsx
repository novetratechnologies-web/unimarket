import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  UserCircle,
  Package,
  ShoppingBag,
  MessageSquare,
  Settings,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronRight,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

const AccountDropdown = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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
        { label: "Contact Support", icon: <Mail className="w-4 h-4" />, path: "/contact" },
      ]
    }
  ];

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Mobile version - simplified account section
  if (isMobile) {
    if (!isAuthenticated) {
      return (
        <div className="px-5 py-6 border-b border-gray-100">
          <p className="text-sm text-gray-600 mb-3">Welcome to UniMarket</p>
          <div className="space-y-2">
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </Link>
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.firstName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-teal-600" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-1">
          {accountMenuItems.flatMap(section => 
            section.items.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-teal-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-teal-600">{item.icon}</span>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    );
  }

  // Desktop version
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="hidden md:flex items-center gap-2 px-4 py-2 text-teal-600 hover:text-teal-700 font-medium hover:bg-teal-50 rounded-lg transition-all duration-200 border border-teal-200 hover:border-teal-300 hover:shadow-md hover:scale-105 active:scale-95"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Link>
        <Link
          to="/register"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 relative overflow-hidden group"
        >
          <UserPlus className="w-4 h-4" />
          <span className="relative z-10">Join Free</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
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
        <div className="hidden sm:block text-left">
          <p className="text-xs text-gray-500">Hello,</p>
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 transition-colors max-w-[100px] truncate">
              {user?.firstName || "Account"}
            </p>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-dropdown dropdown-animation"
          onClick={(e) => e.stopPropagation()}
        >
          {/* User Header */}
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

          {/* Menu Sections */}
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
                      setIsOpen(false);
                      navigate(item.path);
                    }}
                    className="w-full text-left flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-200 group"
                  >
                    <span className="text-gray-400 group-hover:text-teal-600 group-hover:scale-110 transition-all duration-200">
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium group-hover:text-teal-700 flex-1">
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 hover:from-red-100 hover:to-rose-100 rounded-lg font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
            >
              <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDropdown;