import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api";
import { 
  Bell, 
  Mail, 
  Smartphone,
  ShoppingBag,
  MessageSquare,
  Heart,
  Tag,
  Shield,
  Save,
  CheckCircle
} from "lucide-react";

export default function NotificationsTab() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    smsNotifications: user?.preferences?.smsNotifications ?? false,
    
    // Email preferences
    emailMarketing: user?.preferences?.emailMarketing ?? false,
    emailOrders: user?.preferences?.emailOrders ?? true,
    emailMessages: user?.preferences?.emailMessages ?? true,
    emailPromotions: user?.preferences?.emailPromotions ?? false,
    
    // Push preferences
    pushOrders: user?.preferences?.pushOrders ?? true,
    pushMessages: user?.preferences?.pushMessages ?? true,
    pushWishlist: user?.preferences?.pushWishlist ?? true,
    pushPromotions: user?.preferences?.pushPromotions ?? false,
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/auth/profile", { preferences });
      setSuccess(true);
      setMessage("Notification preferences updated");
      await refreshUser();
      setTimeout(() => {
        setSuccess(false);
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Notification Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">
          Choose how you want to be notified
        </p>
      </div>

      {message && (
        <div className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-2 ${
          success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          <CheckCircle className="w-5 h-5" />
          {message}
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="font-medium text-gray-800">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={() => handleToggle("emailNotifications")}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="font-medium text-gray-800">Push Notifications</p>
                  <p className="text-sm text-gray-600">Browser and mobile push</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.pushNotifications}
                onChange={() => handleToggle("pushNotifications")}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="font-medium text-gray-800">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Text messages for urgent updates</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.smsNotifications}
                onChange={() => handleToggle("smsNotifications")}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </label>
          </div>
        </div>

        {/* Email Preferences */}
        {preferences.emailNotifications && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Email Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.emailOrders}
                  onChange={() => handleToggle("emailOrders")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-gray-700">Order updates</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.emailMessages}
                  onChange={() => handleToggle("emailMessages")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-gray-700">Messages</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.emailWishlist}
                  onChange={() => handleToggle("emailWishlist")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-gray-700">Wishlist updates</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.emailPromotions}
                  onChange={() => handleToggle("emailPromotions")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-teal-600" />
                  <span className="text-sm text-gray-700">Promotions & deals</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Push Preferences */}
        {preferences.pushNotifications && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Push Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.pushOrders}
                  onChange={() => handleToggle("pushOrders")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <ShoppingBag className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-gray-700">Order updates</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.pushMessages}
                  onChange={() => handleToggle("pushMessages")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-gray-700">Messages</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.pushWishlist}
                  onChange={() => handleToggle("pushWishlist")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <Heart className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-gray-700">Wishlist updates</span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={preferences.pushPromotions}
                  onChange={() => handleToggle("pushPromotions")}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <Tag className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-gray-700">Promotions</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}