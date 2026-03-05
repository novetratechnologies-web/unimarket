// src/pages/auth/VerifyEmail.jsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Shield,
  LogIn,
  Copy,
  Check
} from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const email = searchParams.get("email") || user?.email || localStorage.getItem('pendingVerificationEmail');
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(5);
  const [copied, setCopied] = useState(false);
  
  const inputRefs = useRef([]);

  // Check if user is already verified
  useEffect(() => {
    if (user?.isVerified) {
      setIsVerified(true);
      setMessage({
        text: "✅ Your email is already verified!",
        type: "success"
      });
      
      // Auto redirect to dashboard if logged in, otherwise to login
      const timer = setInterval(() => {
        setAutoRedirectTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (user) {
              navigate("/dashboard");
            } else {
              navigate("/login", {
                state: { message: "Email already verified! Please login." }
              });
            }
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-submit when all digits are entered
  useEffect(() => {
    const isComplete = code.every(digit => digit !== "");
    if (isComplete && !loading && !isVerified) {
      handleSubmit();
    }
  }, [code]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !isVerified) {
      inputRefs.current[0].focus();
    }
  }, [isVerified]);

  // Handle individual digit input
  const handleDigitChange = (index, value) => {
    // Only allow single digit numbers
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move to previous input and clear it
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
        
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
      } else if (code[index]) {
        // Clear current input
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    
    const newCode = [...code];
    digits.forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setCode(newCode);
    
    if (digits.length > 0) {
      const nextIndex = Math.min(digits.length, 5);
      setActiveIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Copy email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit verification
  const handleSubmit = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setMessage({
        text: "Please enter a valid 6-digit code",
        type: "error"
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await api.post("/auth/verify-email", {
        email,
        code: verificationCode
      });

      if (response.success || response.data?.success) {
        setMessage({
          text: response.data?.message || "🎉 Email verified successfully!",
          type: "success"
        });
        setIsVerified(true);
        
        // Clear stored email
        localStorage.removeItem('pendingVerificationEmail');
        
        // Refresh user data in context if logged in
        if (refreshUser) {
          await refreshUser();
        }
        
        // Start auto-redirect countdown
        let seconds = 5;
        const timer = setInterval(() => {
          seconds -= 1;
          setAutoRedirectTimer(seconds);
          
          if (seconds <= 0) {
            clearInterval(timer);
            
            // Redirect based on auth status
            if (user) {
              navigate("/dashboard", {
                state: { message: "Email verified successfully! Welcome back!" }
              });
            } else {
              navigate("/login", {
                state: { 
                  message: "Email verified successfully! Please login to continue.",
                  email: email 
                }
              });
            }
          }
        }, 1000);
        
        return () => clearInterval(timer);
        
      } else {
        setMessage({
          text: response.error || response.message || "Verification failed",
          type: "error"
        });
        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        setActiveIndex(0);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      // Handle specific error codes
      const errorMessage = error.response?.data?.message;
      const errorCode = error.response?.data?.code;
      
      let displayMessage = "An error occurred during verification";
      
      if (errorCode === 'INVALID_CODE') {
        displayMessage = "Invalid or expired verification code. Please request a new one.";
      } else if (errorCode === 'USER_NOT_FOUND') {
        displayMessage = "No account found with this email address.";
      } else if (errorCode === 'ALREADY_VERIFIED') {
        displayMessage = "This email is already verified. You can login now.";
        setIsVerified(true);
      } else if (errorMessage) {
        displayMessage = errorMessage;
      }
      
      setMessage({
        text: displayMessage,
        type: "error"
      });
      
      setCode(["", "", "", "", "", ""]);
      setActiveIndex(0);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!email) {
      setMessage({
        text: "Email address is required",
        type: "error"
      });
      return;
    }

    if (cooldown > 0) return;

    setResendLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await api.post("/auth/resend-verification", { email });

      if (response.success || response.data?.success) {
        setMessage({
          text: response.data?.message || "📧 New verification code sent!",
          type: "success"
        });
        setCooldown(60); // 1 minute cooldown
        
        // Clear code fields for new code
        setCode(["", "", "", "", "", ""]);
        setActiveIndex(0);
        inputRefs.current[0]?.focus();
      } else {
        setMessage({
          text: response.error || "Failed to resend verification code",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      
      const errorCode = error.response?.data?.code;
      let errorMessage = "Failed to resend code";
      
      if (errorCode === 'RATE_LIMITED') {
        const retryAfter = error.response?.data?.retryAfter || 60;
        setCooldown(retryAfter);
        errorMessage = `Please wait ${retryAfter} seconds before requesting again.`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMessage({
        text: errorMessage,
        type: "error"
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Format cooldown time
  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Required</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find an email address to verify. Please login or register first.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
            >
              Go to Login
            </Link>
            <Link
              to="/register"
              className="flex-1 border border-teal-600 text-teal-600 py-3 rounded-lg font-semibold hover:bg-teal-50 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-teal-100 opacity-90">
            Secure access to your campus marketplace
          </p>
        </div>

        <div className="p-8">
          {/* Email Display */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-teal-600" />
              <p className="text-sm text-gray-600">Verification code sent to</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="font-mono font-bold text-lg bg-gray-50 py-2 px-4 rounded-lg">
                {email}
              </p>
              <button
                onClick={handleCopyEmail}
                className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                title="Copy email"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Already Verified Message with Auto-redirect */}
          {isVerified && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800">Successfully Verified!</p>
                  <p className="text-sm text-green-600 mt-1">
                    Redirecting to {user ? 'dashboard' : 'login'} in {autoRedirectTimer} seconds...
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-700">{autoRedirectTimer}</span>
                </div>
              </div>
            </div>
          )}

          {/* Code Input */}
          {!isVerified && (
            <>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  Enter 6-digit verification code
                </label>
                <div className="flex justify-center gap-3 mb-6">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      onFocus={() => setActiveIndex(index)}
                      className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all ${
                        digit
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-300 hover:border-teal-400 focus:border-teal-500"
                      } outline-none`}
                      disabled={loading || isVerified}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500">
                  Enter the code from your email
                </p>
              </div>

              {/* Message Display */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  <div className="flex items-center gap-3">
                    {message.type === "success" ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || code.some(d => d === "")}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  loading || code.some(d => d === "")
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </button>
            </>
          )}

          {/* Resend Section */}
          {!isVerified && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Didn't receive the code?
                </p>
                
                {cooldown > 0 ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span className="font-medium">
                      Resend available in {formatCooldown(cooldown)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendCode}
                    disabled={resendLoading || !email}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      resendLoading || !email
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    }`}
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Resend Verification Code
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              {isVerified ? (
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
                >
                  <LogIn className="w-4 h-4" />
                  {user ? 'Go to Dashboard' : 'Go to Login'}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-3 rounded-lg border border-teal-600 text-teal-600 text-center font-semibold hover:bg-teal-50 transition"
                  >
                    Create New Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Check your spam folder if you don't see the email
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400">
                Dev mode: Check console for verification code
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar for Cooldown */}
        {cooldown > 0 && (
          <div className="px-8 pb-8">
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="absolute top-0 left-0 h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((60 - cooldown) / 60) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0:00</span>
                <span>1:00</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}