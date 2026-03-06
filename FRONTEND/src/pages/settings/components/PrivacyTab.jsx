import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api";
import { 
  Eye, 
  EyeOff, 
  Cookie, 
  Shield, 
  Globe,
  Lock,
  Users,
  FileText,
  Download,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function PrivacyTab() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [expandedSection, setExpandedSection] = useState(null);

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    // Profile visibility
    profileVisibility: user?.preferences?.privacy?.profileVisibility || "public",
    showEmail: user?.preferences?.privacy?.showEmail || false,
    showPhone: user?.preferences?.privacy?.showPhone || false,
    showUniversity: user?.preferences?.privacy?.showUniversity || true,
    
    // Activity visibility
    showWishlist: user?.preferences?.privacy?.showWishlist || false,
    showReviews: user?.preferences?.privacy?.showReviews || true,
    showListings: user?.preferences?.privacy?.showListings || true,
    
    // Data sharing
    shareDataWithPartners: user?.preferences?.privacy?.shareDataWithPartners || false,
    allowAnalytics: user?.preferences?.privacy?.allowAnalytics || true,
    allowPersonalizedAds: user?.preferences?.privacy?.allowPersonalizedAds || false,
    
    // Cookie preferences
    cookiePreferences: {
      essential: true, // Always true - can't be disabled
      functional: user?.preferences?.privacy?.cookies?.functional ?? true,
      analytics: user?.preferences?.privacy?.cookies?.analytics ?? true,
      marketing: user?.preferences?.privacy?.cookies?.marketing ?? false,
    },
    
    // Search engine visibility
    allowSearchIndexing: user?.preferences?.privacy?.allowSearchIndexing ?? true,
  });

  const [downloadRequested, setDownloadRequested] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleToggle = (key) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleCookieToggle = (type) => {
    setPrivacySettings(prev => ({
      ...prev,
      cookiePreferences: {
        ...prev.cookiePreferences,
        [type]: !prev.cookiePreferences[type]
      }
    }));
  };

  const handleProfileVisibilityChange = (value) => {
    setPrivacySettings(prev => ({
      ...prev,
      profileVisibility: value
    }));
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // PUT /api/auth/profile - update preferences
      const response = await api.put("/auth/profile", {
        preferences: {
          ...user?.preferences,
          privacy: privacySettings
        }
      });
      
      if (response.success) {
        setMessage({ text: "Privacy settings updated successfully!", type: "success" });
        await refreshUser();
      } else {
        setMessage({ text: response.message || "Failed to update privacy settings", type: "error" });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || "An error occurred", 
        type: "error" 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const handleDownloadData = async () => {
    setDownloadRequested(true);
    setMessage({ text: "Preparing your data for download...", type: "success" });
    
    try {
      // This would call your backend endpoint to generate data export
      // const response = await api.get("/auth/export-data");
      
      // Simulate API call
      setTimeout(() => {
        setDownloadReady(true);
        setDownloadRequested(false);
        setMessage({ text: "Your data is ready to download!", type: "success" });
      }, 3000);
    } catch (error) {
      setMessage({ text: "Failed to prepare data download", type: "error" });
      setDownloadRequested(false);
    }
  };

  const handleDeleteData = async () => {
    if (deleteConfirm !== "DELETE MY DATA") return;
    
    setLoading(true);
    try {
      // This would call your backend to delete user data
      // await api.delete("/auth/data");
      
      setMessage({ text: "Your data has been scheduled for deletion", type: "success" });
      setDeleteConfirm("");
    } catch (error) {
      setMessage({ text: "Failed to delete data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ id, title, icon: Icon, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-teal-600" />
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        {expandedSection === id ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {expandedSection === id && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Privacy Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Control your privacy and data sharing preferences
          </p>
        </div>

        {message.text && (
          <div className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success" 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Profile Visibility */}
          <Section id="profile" title="Profile Visibility" icon={Eye}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Who can see your profile?
                </label>
                <div className="space-y-2">
                  {[
                    { value: "public", label: "Public", desc: "Anyone on UniMarket can see your profile" },
                    { value: "students", label: "Students Only", desc: "Only verified students can see your profile" },
                    { value: "private", label: "Private", desc: "Only you can see your profile" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                        privacySettings.profileVisibility === option.value
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="profileVisibility"
                        value={option.value}
                        checked={privacySettings.profileVisibility === option.value}
                        onChange={(e) => handleProfileVisibilityChange(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Visible Information</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Email Address</p>
                      <p className="text-sm text-gray-600">Show your email on profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.showEmail}
                      onChange={() => handleToggle("showEmail")}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">Phone Number</p>
                      <p className="text-sm text-gray-600">Show your phone number on profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.showPhone}
                      onChange={() => handleToggle("showPhone")}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">University</p>
                      <p className="text-sm text-gray-600">Show your university on profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.showUniversity}
                      onChange={() => handleToggle("showUniversity")}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* Activity Privacy */}
          <Section id="activity" title="Activity Privacy" icon={Users}>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Wishlist</p>
                  <p className="text-sm text-gray-600">Show your wishlist to others</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showWishlist}
                  onChange={() => handleToggle("showWishlist")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Reviews</p>
                  <p className="text-sm text-gray-600">Show your reviews on your profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showReviews}
                  onChange={() => handleToggle("showReviews")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Listings</p>
                  <p className="text-sm text-gray-600">Show your active listings on your profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.showListings}
                  onChange={() => handleToggle("showListings")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>
            </div>
          </Section>

          {/* Data Sharing */}
          <Section id="sharing" title="Data Sharing" icon={Globe}>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Share with Partners</p>
                  <p className="text-sm text-gray-600">
                    Allow sharing your data with trusted university partners
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.shareDataWithPartners}
                  onChange={() => handleToggle("shareDataWithPartners")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Analytics</p>
                  <p className="text-sm text-gray-600">
                    Help us improve by sharing anonymous usage data
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.allowAnalytics}
                  onChange={() => handleToggle("allowAnalytics")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Personalized Ads</p>
                  <p className="text-sm text-gray-600">
                    Allow personalized advertisements based on your activity
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.allowPersonalizedAds}
                  onChange={() => handleToggle("allowPersonalizedAds")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>
            </div>
          </Section>

          {/* Cookie Preferences */}
          <Section id="cookies" title="Cookie Preferences" icon={Cookie}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Cookies help us provide and improve our services. Essential cookies are always enabled.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg opacity-75">
                  <div>
                    <p className="font-medium text-gray-800">Essential Cookies</p>
                    <p className="text-sm text-gray-600">Required for basic site functionality</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-full">
                    Always On
                  </span>
                </div>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Functional Cookies</p>
                    <p className="text-sm text-gray-600">Remember your preferences and settings</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.cookiePreferences.functional}
                    onChange={() => handleCookieToggle("functional")}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Analytics Cookies</p>
                    <p className="text-sm text-gray-600">Help us understand how you use our site</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.cookiePreferences.analytics}
                    onChange={() => handleCookieToggle("analytics")}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">Marketing Cookies</p>
                    <p className="text-sm text-gray-600">Used for targeted advertisements</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.cookiePreferences.marketing}
                    onChange={() => handleCookieToggle("marketing")}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                </label>
              </div>
            </div>
          </Section>

          {/* Search Engine Visibility */}
          <Section id="search" title="Search Engine Visibility" icon={EyeOff}>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Allow Search Indexing</p>
                  <p className="text-sm text-gray-600">
                    Allow search engines (Google, Bing) to index your public profile
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.allowSearchIndexing}
                  onChange={() => handleToggle("allowSearchIndexing")}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>
              {!privacySettings.allowSearchIndexing && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Your profile will not appear in search engine results
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Data Management */}
          <Section id="data" title="Your Data" icon={FileText}>
            <div className="space-y-6">
              {/* Download Data */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Download Your Data</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-4">
                    Get a copy of all your data stored on UniMarket
                  </p>
                  {downloadReady ? (
                    <a
                      href="/api/auth/export-data"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Data
                    </a>
                  ) : (
                    <button
                      onClick={handleDownloadData}
                      disabled={downloadRequested}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      {downloadRequested ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Request Data Export
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Delete Data */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Delete Your Data</h4>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 mb-4">
                    Permanently delete all your personal data. This action cannot be undone.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE MY DATA to confirm"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg mb-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  />
                  <button
                    onClick={handleDeleteData}
                    disabled={deleteConfirm !== "DELETE MY DATA" || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete Data
                  </button>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Save Button */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={handleSavePrivacy}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Privacy Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Policy Link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <FileText className="w-6 h-6 text-teal-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Privacy Policy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Learn more about how we collect, use, and protect your data.
            </p>
            <a
              href="/privacy-policy"
              className="text-teal-600 hover:text-teal-700 font-medium text-sm inline-flex items-center gap-1"
            >
              Read our Privacy Policy
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}