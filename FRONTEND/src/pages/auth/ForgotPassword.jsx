// src/pages/auth/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  FiEye, 
  FiEyeOff, 
  FiCheck, 
  FiX, 
  FiArrowLeft, 
  FiMail, 
  FiLock,
  FiAlertCircle,
  FiClock,
  FiShield
} from "react-icons/fi";
import { api } from "../../api";
import logo from "../../assets/uni_logo.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';

  const [step, setStep] = useState(1); // 1: Request reset, 2: Verify code, 3: Reset password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [rateLimit, setRateLimit] = useState({
    isLimited: false,
    retryAfter: 0
  });
  
  const [form, setForm] = useState({
    email: emailFromParams,
    verificationCode: ["", "", "", "", "", ""],
    newPassword: "",
    confirmPassword: ""
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [touched, setTouched] = useState({
    email: false,
    newPassword: false,
    confirmPassword: false
  });

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Rate limit countdown timer
  useEffect(() => {
    let timer;
    if (rateLimit.isLimited && rateLimit.retryAfter > 0) {
      timer = setInterval(() => {
        setRateLimit(prev => ({
          ...prev,
          retryAfter: Math.max(0, prev.retryAfter - 1),
          isLimited: prev.retryAfter - 1 > 0
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rateLimit.isLimited, rateLimit.retryAfter]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 2) {
      const firstInput = document.getElementById('otp-0');
      if (firstInput) firstInput.focus();
    }
  }, [step]);

  const validatePassword = (password) => {
    return {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "newPassword") {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
  };

  // OTP Input Handlers
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newCode = [...form.verificationCode];
    newCode[index] = digit;
    setForm({ ...form, verificationCode: newCode });

    // Auto-focus next input
    if (digit && index < 5) {
      setActiveIndex(index + 1);
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!form.verificationCode[index] && index > 0) {
        // Move to previous input and clear it
        setActiveIndex(index - 1);
        document.getElementById(`otp-${index - 1}`)?.focus();
        
        const newCode = [...form.verificationCode];
        newCode[index - 1] = "";
        setForm({ ...form, verificationCode: newCode });
      } else if (form.verificationCode[index]) {
        // Clear current input
        const newCode = [...form.verificationCode];
        newCode[index] = "";
        setForm({ ...form, verificationCode: newCode });
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    
    const newCode = [...form.verificationCode];
    digits.forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setForm({ ...form, verificationCode: newCode });
    
    if (digits.length > 0) {
      const nextIndex = Math.min(digits.length, 5);
      setActiveIndex(nextIndex);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    }
  };

  // Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!validateEmail(form.email)) {
      setMessage({ 
        text: "Please enter a valid email address", 
        type: "error",
        friendlyMessage: "Enter your university email address to reset your password."
      });
      return;
    }

    if (rateLimit.isLimited) {
      setMessage({ 
        text: `Too many attempts. Please wait ${rateLimit.retryAfter} seconds.`, 
        type: "error" 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/forgot-password", {
        email: form.email.toLowerCase().trim()
      });

      // Handle different response formats
      const successMessage = response.data?.message || 
                            response.message || 
                            "Verification code sent to your email. Please check your inbox.";

      const friendlyMessage = response.data?.friendlyMessage ||
                             "We've sent a 6-digit code to your email. Check your inbox (and spam folder).";

      setMessage({ 
        text: successMessage,
        friendlyMessage: friendlyMessage,
        type: "success" 
      });
      
      setStep(2);
      setCountdown(60); // 60 seconds countdown
      
    } catch (error) {
      console.error("Request reset error:", error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.['retry-after'] || 
                          error.response?.data?.retryAfter || 60;
        
        setMessage({ 
          text: `Too many attempts. Please try again in ${retryAfter} seconds.`,
          friendlyMessage: "You've made too many requests. Please wait a moment before trying again.",
          type: "error" 
        });
        
        setRateLimit({
          isLimited: true,
          retryAfter: parseInt(retryAfter)
        });
      } 
      // Handle user not found (don't reveal if email exists or not for security)
      else if (error.response?.status === 404) {
        setMessage({ 
          text: "If this email is registered, you'll receive a verification code.",
          friendlyMessage: "For security reasons, we don't reveal if an email exists. If it's registered, check your inbox.",
          type: "info" 
        });
        setStep(2);
        setCountdown(60);
      }
      else {
        setMessage({ 
          text: error.response?.data?.message || "Failed to send verification code. Please try again.",
          friendlyMessage: "Something went wrong. Please try again or contact support.",
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const code = form.verificationCode.join('');
    
    if (code.length !== 6) {
      setMessage({ 
        text: "Please enter the complete 6-digit verification code",
        friendlyMessage: "Enter all 6 digits from the email we sent you.",
        type: "error" 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/verify-reset-code", {
        email: form.email.toLowerCase().trim(),
        code: code
      });

      const successMessage = response.data?.message || 
                            response.message || 
                            "Code verified successfully.";

      setMessage({ 
        text: successMessage,
        friendlyMessage: "Great! Your code is verified. Now you can create a new password.",
        type: "success" 
      });
      
      setStep(3);
      
    } catch (error) {
      console.error("Verify code error:", error);
      
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.['retry-after'] || 60;
        setMessage({ 
          text: `Too many attempts. Please try again in ${retryAfter} seconds.`,
          type: "error" 
        });
        setRateLimit({
          isLimited: true,
          retryAfter: parseInt(retryAfter)
        });
      } else if (error.response?.status === 400) {
        setMessage({ 
          text: error.response?.data?.message || "Invalid or expired verification code.",
          friendlyMessage: "That code doesn't work. It may be expired or incorrect. Try requesting a new one.",
          type: "error" 
        });
        // Clear OTP fields
        setForm({ ...form, verificationCode: ["", "", "", "", "", ""] });
        setActiveIndex(0);
        document.getElementById('otp-0')?.focus();
      } else {
        setMessage({ 
          text: error.response?.data?.message || "Failed to verify code. Please try again.",
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // Validate password
    if (form.newPassword.length < 8) {
      setMessage({ 
        text: "Password must be at least 8 characters long",
        friendlyMessage: "Make your password at least 8 characters for better security.",
        type: "error" 
      });
      return;
    }

    const isStrongPassword = Object.values(passwordStrength).every(Boolean);
    if (!isStrongPassword) {
      const missing = [];
      if (!passwordStrength.hasUpperCase) missing.push("uppercase letter");
      if (!passwordStrength.hasLowerCase) missing.push("lowercase letter");
      if (!passwordStrength.hasNumber) missing.push("number");
      if (!passwordStrength.hasSpecialChar) missing.push("special character");
      
      setMessage({ 
        text: `Password must contain: ${missing.join(", ")}`,
        friendlyMessage: `Your password needs to be stronger. Add ${missing.join(", ")}.`,
        type: "error" 
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ 
        text: "Passwords do not match",
        friendlyMessage: "The passwords you entered don't match. Please check and try again.",
        type: "error" 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/reset-password", {
        email: form.email.toLowerCase().trim(),
        code: form.verificationCode.join(''),
        newPassword: form.newPassword
      });

      const successMessage = response.data?.message || 
                            response.message || 
                            "Password reset successfully!";

      setMessage({ 
        text: successMessage,
        friendlyMessage: "Your password has been reset! Redirecting you to login...",
        type: "success" 
      });
      
      // Clear any rate limit data
      localStorage.removeItem('resetAttempts');
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Password reset successful! Please login with your new password.",
            email: form.email 
          } 
        });
      }, 2000);
      
    } catch (error) {
      console.error("Reset password error:", error);
      
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.['retry-after'] || 60;
        setMessage({ 
          text: `Too many attempts. Please try again in ${retryAfter} seconds.`,
          type: "error" 
        });
        setRateLimit({
          isLimited: true,
          retryAfter: parseInt(retryAfter)
        });
      } else if (error.response?.status === 400) {
        setMessage({ 
          text: error.response?.data?.message || "Invalid or expired reset session.",
          friendlyMessage: "Your reset session may have expired. Please start over from the beginning.",
          type: "error" 
        });
        // Go back to step 1 after delay
        setTimeout(() => setStep(1), 3000);
      } else {
        setMessage({ 
          text: error.response?.data?.message || "Failed to reset password. Please try again.",
          friendlyMessage: "Something went wrong. Please try again or contact support.",
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || rateLimit.isLimited) return;

    try {
      setLoading(true);
      const response = await api.post("/auth/resend-reset-code", {
        email: form.email.toLowerCase().trim()
      });

      const successMessage = response.data?.message || 
                            response.message || 
                            "Verification code resent to your email.";

      setMessage({ 
        text: successMessage,
        friendlyMessage: "A new code has been sent to your email. Check your inbox.",
        type: "success" 
      });
      
      setCountdown(60);
      
      // Clear OTP fields for new code
      setForm({ ...form, verificationCode: ["", "", "", "", "", ""] });
      setActiveIndex(0);
      document.getElementById('otp-0')?.focus();
      
    } catch (error) {
      console.error("Resend code error:", error);
      
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers?.['retry-after'] || 60;
        setMessage({ 
          text: `Too many attempts. Please try again in ${retryAfter} seconds.`,
          type: "error" 
        });
        setCountdown(retryAfter);
      } else {
        setMessage({ 
          text: error.response?.data?.message || "Failed to resend code. Please try again.",
          type: "error" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-gray-400"}`}>
      {met ? <FiCheck className="flex-shrink-0" /> : <FiX className="flex-shrink-0" />}
      <span>{text}</span>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleRequestReset} className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiMail className="text-3xl text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Reset Your Password</h3>
              <p className="text-gray-500 text-sm mt-2">
                Enter your email address and we'll send you a verification code
              </p>
            </div>

            <div>
              <input
                type="email" 
                name="email"
                placeholder="Enter your university email"
                value={form.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                disabled={rateLimit.isLimited}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                  touched.email && !validateEmail(form.email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              />
              {touched.email && !validateEmail(form.email) && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <FiAlertCircle /> Please enter a valid email address
                </p>
              )}
            </div>

            {/* Rate Limit Warning */}
            {rateLimit.isLimited && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
                <FiClock className="text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Too many attempts. Please wait {rateLimit.retryAfter} seconds.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !validateEmail(form.email) || rateLimit.isLimited}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading || !validateEmail(form.email) || rateLimit.isLimited
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending Code...
                </div>
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Enter Verification Code</h3>
              <p className="text-gray-500 text-sm mt-2">
                We sent a 6-digit code to <span className="font-medium text-gray-800">{form.email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {form.verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    disabled={loading || rateLimit.isLimited}
                    className={`w-12 h-12 text-center text-xl font-bold rounded-xl border-2 transition-all ${
                      digit
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-300 hover:border-teal-400 focus:border-teal-500"
                    } outline-none ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading || rateLimit.isLimited}
                  className={`text-sm ${
                    countdown > 0 || rateLimit.isLimited
                      ? "text-gray-400 cursor-not-allowed" 
                      : "text-teal-600 hover:text-teal-700 font-medium"
                  }`}
                >
                  {countdown > 0 
                    ? `Resend code in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` 
                    : rateLimit.isLimited
                    ? `Try again in ${rateLimit.retryAfter}s`
                    : "Resend verification code"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || form.verificationCode.some(d => d === "") || rateLimit.isLimited}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                  loading || form.verificationCode.some(d => d === "") || rateLimit.isLimited
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Verify Code"
                )}
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiLock className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Create New Password</h3>
              <p className="text-gray-500 text-sm mt-2">
                Choose a strong password for your account
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="New Password"
                  value={form.newPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('newPassword')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-10 ${
                    rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={rateLimit.isLimited}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {form.newPassword && (
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FiShield className="text-teal-600" />
                    Password Requirements:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <PasswordRequirement met={passwordStrength.hasMinLength} text="8+ characters" />
                    <PasswordRequirement met={passwordStrength.hasUpperCase} text="Uppercase" />
                    <PasswordRequirement met={passwordStrength.hasLowerCase} text="Lowercase" />
                    <PasswordRequirement met={passwordStrength.hasNumber} text="Number" />
                    <PasswordRequirement met={passwordStrength.hasSpecialChar} text="Special character" />
                  </div>
                </div>
              )}

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-10 ${
                    touched.confirmPassword && form.newPassword !== form.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={rateLimit.isLimited}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <FiAlertCircle /> Passwords do not match
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !form.newPassword || !form.confirmPassword || rateLimit.isLimited}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                  loading || !form.newPassword || !form.confirmPassword || rateLimit.isLimited
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-100 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-teal-100">
        {/* Back to Login */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition" />
          <span>Back to Login</span>
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-teal-100 to-cyan-100 p-4 rounded-2xl mb-3">
            <img src={logo} alt="UniMarket Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            UniMarket
          </h1>
          <p className="text-gray-500 text-sm mt-1">Student Marketplace Portal</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  step >= stepNumber
                    ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {stepNumber}
              </div>
              <div
                className={`text-xs mt-2 font-medium ${
                  step >= stepNumber ? "text-teal-600" : "text-gray-400"
                }`}
              >
                {stepNumber === 1 ? "Request" : stepNumber === 2 ? "Verify" : "Reset"}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Message Display */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium ${
              message.type === "success" 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : message.type === "info"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <p>{message.text}</p>
            {message.friendlyMessage && (
              <p className="text-xs mt-2 opacity-80">{message.friendlyMessage}</p>
            )}
          </div>
        )}

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link
              to="/contact"
              className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}