// src/pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext"; 
import config from "../../config/env";
import logo from "../../assets/uni_logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [submitted, setSubmitted] = useState(false); // ✅ NEW: Prevent double submission
  
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const formRef = useRef(null); // ✅ NEW: Reference to form
  const redirectTimeoutRef = useRef(null); // ✅ NEW: Cleanup redirect timeout

  // ✅ NEW: Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // ✅ FIXED: handleSubmit with double submission prevention
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 CRITICAL: Prevent multiple submissions
    if (submitted || loading) {
      console.log('⚠️ Form already submitted, preventing duplicate');
      return;
    }

    // Clear previous messages
    setMessage({ text: "", type: "" });

    // Validate inputs
    if (!email || !password) {
      setMessage({ text: "Please fill in all fields", type: "error" });
      return;
    }

    if (!isValidEmail(email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setSubmitted(true); // ✅ Mark as submitted
      
      console.log('🔐 Starting login process...', { email });
      
      // Use the login function from AuthContext
      const result = await login(email, password);
      
      console.log('✅ Login result:', result);
      
      // Check if verification is required
      if (result?.requiresVerification) {
        setMessage({ 
          text: "Please verify your email to continue. Redirecting...", 
          type: "warning" 
        });
        
        // Clear redirect timeout
        if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
        
        // Redirect to verification page
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 1500);
        return;
      }
      
      // ✅ SUCCESS - Immediate redirect without showing success message
      // (Success message causes unnecessary re-renders)
      console.log('🎉 Login successful, redirecting to dashboard...');
      
      // Use replace instead of navigate to prevent back button issues
      // and avoid triggering additional requests
      redirectTimeoutRef.current = setTimeout(() => {
        window.location.href = '/'; // Hard redirect to prevent React Router issues
      }, 100); // Short delay for better UX
      
    } catch (err) {
      console.error("❌ Login error:", err);
      
      // Reset submission state on error
      setSubmitted(false);
      
      // Handle email verification requirement
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.message?.includes('verify')) {
        setMessage({ 
          text: "Please verify your email before logging in. Redirecting to verification...", 
          type: "warning" 
        });
        
        // Store email and redirect
        sessionStorage.setItem('pending_verification_email', email);
        
        if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 1500);
        return;
      }
      
      // Handle account locked
      if (err.code === 'ACCOUNT_LOCKED' || err.message?.includes('locked')) {
        setMessage({ 
          text: err.message || "Account temporarily locked. Please try again later.", 
          type: "error" 
        });
        return;
      }
      
      // Handle other errors
      let errorMessage = "Login failed. Please try again.";
      
      if (err.message?.includes('Invalid')) {
        errorMessage = "Invalid email or password.";
      } else if (err.message?.includes('Network')) {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setMessage({ 
        text: errorMessage, 
        type: "error" 
      });
    } finally {
      setLoading(false);
      // Don't reset submitted on success - keep it true to prevent double submission
      // Only reset on error
    }
  };

  const handleGoogleLogin = async () => {
    // 🛑 Prevent multiple Google login attempts
    if (googleLoading) return;
    
    try {
      setGoogleLoading(true);
      setMessage({ text: "", type: "" });
      
      // Use the googleLogin function from AuthContext
      googleLogin();
      
      // Note: The googleLogin function will trigger a page redirect
      // So we don't need to do anything else here
    } catch (error) {
      console.error("Google login error:", error);
      setMessage({ 
        text: "Google authentication failed. Please try again.", 
        type: "error" 
      });
      setGoogleLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    return email && password && isValidEmail(email) && !loading && !submitted;
  };

  const handleDemoLogin = () => {
    // 🛑 Prevent demo login if already loading
    if (loading || submitted) return;
    
    // Demo credentials for testing
    const demoCredentials = {
      email: "example@gmail.com",
      password: "strong"
    };
    
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    
    // Auto-submit after a delay
    setTimeout(() => {
      if (formRef.current) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
        formRef.current.dispatchEvent(submitEvent);
      }
    }, 500);
  };

  // ✅ NEW: Reset form state when component unmounts or route changes
  useEffect(() => {
    return () => {
      setSubmitted(false);
      setLoading(false);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-100 px-4 py-8">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md border border-teal-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-100 p-3 rounded-2xl mb-3">
            <img src={logo} alt="UniMarket Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            UniMarket
          </h1>
          <p className="text-gray-600 text-sm mt-1">Student Marketplace Portal</p>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Welcome Back
        </h2>

        <form 
          ref={formRef} 
          onSubmit={handleSubmit} 
          className="space-y-5"
          noValidate // ✅ Prevent browser validation that might cause double submission
        >
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage({ text: "", type: "" });
                }}
                className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                required
                disabled={loading || submitted}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage({ text: "", type: "" });
                }}
                className="w-full border border-gray-300 rounded-lg px-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition pr-10"
                required
                disabled={loading || submitted}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                disabled={loading || submitted}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-teal-600 hover:text-teal-700 hover:underline transition font-medium"
              tabIndex={loading || submitted ? -1 : 0}
            >
              Forgot your password?
            </Link>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.type === "success" 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : message.type === "warning"
                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <div className="flex items-start">
                {message.type === "success" ? (
                  <span className="mr-2">✅</span>
                ) : message.type === "warning" ? (
                  <span className="mr-2">⚠️</span>
                ) : (
                  <span className="mr-2">❌</span>
                )}
                <span>{message.text}</span>
              </div>
              
              {/* Show verification link if needed */}
              {message.text.includes("verify your email") && (
                <div className="mt-2">
                  <Link 
                    to={`/verify-email?email=${encodeURIComponent(email)}`}
                    className="text-teal-600 hover:underline text-sm font-medium inline-flex items-center"
                  >
                    Go to verification page →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              !isFormValid()
                ? "bg-gray-400 cursor-not-allowed opacity-75"
                : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </div>
            ) : submitted ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redirecting...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="text-sm text-gray-400 mx-4">or continue with</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading || submitted}
          className={`w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg transition-all duration-200 font-medium ${
            googleLoading || loading || submitted
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
          }`}
        >
          {googleLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Connecting to Google...
            </div>
          ) : (
            <>
              <FcGoogle className="text-xl" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Demo Login Button (for testing) */}
        {config.isDevelopment && (
          <div className="mt-4">
            <button
              onClick={handleDemoLogin}
              disabled={loading || submitted}
              className="w-full py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Demo Account
            </button>
          </div>
        )}

        {/* Registration Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition"
              tabIndex={loading || submitted ? -1 : 0}
            >
              Create account
            </Link>
          </p>
          
          <p className="text-xs text-gray-500 mt-2">
            By signing in, you agree to our Terms and Conditions
          </p>
        </div>

        {/* Environment Indicator (for debugging) */}
        {config.isDevelopment && (
          <div className="mt-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 text-center">
              <strong>Development Mode</strong> • API: {config.api.baseURL}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}