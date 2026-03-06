import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api";
import { 
  Key, 
  Eye, 
  EyeOff, 
  Shield, 
  Smartphone,
  AlertCircle,
  CheckCircle,
  LogOut
} from "lucide-react";

export default function SecurityTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.preferences?.twoFactorEnabled || false);
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));

    if (name === "newPassword") {
      setPasswordStrength({
        hasMinLength: value.length >= 8,
        hasUpperCase: /[A-Z]/.test(value),
        hasLowerCase: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }

    const isStrong = Object.values(passwordStrength).every(Boolean);
    if (!isStrong) {
      setMessage({ text: "Password does not meet strength requirements", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // POST /api/auth/change-password - from your routes
      const response = await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      if (response.success) {
        setMessage({ text: "Password changed successfully!", type: "success" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        setMessage({ text: response.message || "Failed to change password", type: "error" });
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

  const handleInvalidateSessions = async () => {
    if (!confirm("This will log you out of all devices. Continue?")) return;

    setLoading(true);
    try {
      // POST /api/auth/invalidate-all-sessions - from your routes
      const response = await api.post("/auth/invalidate-all-sessions", {
        password: passwordForm.currentPassword
      });
      
      if (response.success) {
        setMessage({ text: "All other sessions logged out", type: "success" });
      }
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || "Failed to invalidate sessions", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
          <p className="text-sm text-gray-600 mt-1">Update your password regularly to keep your account secure</p>
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

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {passwordForm.newPassword && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`text-sm ${passwordStrength.hasMinLength ? "text-green-600" : "text-gray-400"}`}>
                  ✓ At least 8 characters
                </div>
                <div className={`text-sm ${passwordStrength.hasUpperCase ? "text-green-600" : "text-gray-400"}`}>
                  ✓ One uppercase letter
                </div>
                <div className={`text-sm ${passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-400"}`}>
                  ✓ One lowercase letter
                </div>
                <div className={`text-sm ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-400"}`}>
                  ✓ One number
                </div>
                <div className={`text-sm ${passwordStrength.hasSpecialChar ? "text-green-600" : "text-gray-400"}`}>
                  ✓ One special character
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {passwordForm.newPassword && passwordForm.confirmPassword && 
            passwordForm.newPassword !== passwordForm.confirmPassword && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              Passwords do not match
            </p>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Key className="w-4 h-4" />
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
            </div>
            <button
              onClick={() => setShowTwoFASetup(!showTwoFASetup)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                twoFAEnabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              {twoFAEnabled ? "Disable" : "Enable"}
            </button>
          </div>

          {showTwoFASetup && !twoFAEnabled && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {/* QR Code would go here */}
              <div className="flex justify-end">
                <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  Verify & Enable
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-medium text-gray-800">Active Sessions</h3>
                <p className="text-sm text-gray-600">Manage devices where you're logged in</p>
              </div>
            </div>
            <button
              onClick={handleInvalidateSessions}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Log out all devices
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Current Session</p>
                  <p className="text-sm text-gray-600">Chrome on Windows • Last active now</p>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
            </div>
            {/* More sessions would be fetched from backend */}
          </div>
        </div>
      </div>
    </div>
  );
}