import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  Smartphone,
  LogOut,
  Menu,
  AlertTriangle // Add this icon for DangerZone
} from "lucide-react";

// Import tab components
import ProfileTab from "./components/ProfileTab";
import SecurityTab from "./components/SecurityTab";
import SessionsTab from "./components/SessionsTab";
import NotificationsTab from "./components/NotificationsTab";
import PrivacyTab from "./components/PrivacyTab";
import DangerZone from "./components/DangerZone";

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "profile", label: "Profile", icon: User, component: ProfileTab },
    { id: "security", label: "Security", icon: Shield, component: SecurityTab },
    { id: "sessions", label: "Sessions", icon: Smartphone, component: SessionsTab },
    { id: "notifications", label: "Notifications", icon: Bell, component: NotificationsTab },
    { id: "privacy", label: "Privacy", icon: Eye, component: PrivacyTab },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, component: DangerZone }, // 👈 ADD THIS
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProfileTab;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              {/* User Info */}
              <div className="p-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  // Special styling for Danger Zone tab
                  const isDangerTab = tab.id === "danger";
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? isDangerTab
                            ? "bg-red-50 text-red-700" // Special styling when active
                            : "bg-teal-50 text-teal-700"
                          : isDangerTab
                          ? "text-red-600 hover:bg-red-50" // Always show red for danger
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        activeTab === tab.id
                          ? isDangerTab
                            ? "text-red-600"
                            : "text-teal-600"
                          : isDangerTab
                          ? "text-red-500"
                          : "text-gray-400"
                      }`} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 mt-4 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <Menu className="w-5 h-5" />
              <span className="font-medium">
                {tabs.find(t => t.id === activeTab)?.label || "Menu"}
              </span>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {tabs.map((tab) => {
                  const isDangerTab = tab.id === "danger";
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
                        activeTab === tab.id
                          ? isDangerTab
                            ? "bg-red-50 text-red-700"
                            : "bg-teal-50 text-teal-700"
                          : isDangerTab
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}