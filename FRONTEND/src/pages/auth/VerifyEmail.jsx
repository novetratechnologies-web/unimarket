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
  Check,
  Smartphone,
  MailCheck,
  MessageSquare
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
  const [resendMethod, setResendMethod] = useState('email'); // 'email' or 'sms'
  
  const inputRefs = useRef([]);

  // Check if user is already verified
  useEffect(() => {
    if (user?.isVerified) {
      setIsVerified(true);
      setMessage({
        text: "Your email is already verified!",
        type: "success"
      });
      
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
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
        
        const newCode = [...code];
        newCode[index - 1] = "";
        setCode(newCode);
      } else if (code[index]) {
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
          text: "Email verified successfully!",
          type: "success"
        });
        setIsVerified(true);
        
        localStorage.removeItem('pendingVerificationEmail');
        
        if (refreshUser) {
          await refreshUser();
        }
        
        let seconds = 5;
        const timer = setInterval(() => {
          seconds -= 1;
          setAutoRedirectTimer(seconds);
          
          if (seconds <= 0) {
            clearInterval(timer);
            
            if (user) {
              navigate("/dashboard", {
                state: { message: "Email verified successfully! Welcome back!" }
              });
            } else {
              navigate("/login", {
                state: { 
                  message: "Email verified successfully! Please login.",
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
        setCode(["", "", "", "", "", ""]);
        setActiveIndex(0);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      let displayMessage = "An error occurred during verification";
      
      if (errorCode === 'INVALID_CODE') {
        displayMessage = "Invalid or expired code. Please request a new one.";
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
      const endpoint = resendMethod === 'sms' 
        ? "/auth/resend-verification-sms" 
        : "/auth/resend-verification";
      
      const response = await api.post(endpoint, { email });

      if (response.success || response.data?.success) {
        setMessage({
          text: `New verification code sent via ${resendMethod}!`,
          type: "success"
        });
        setCooldown(60);
        
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Email Required</h2>
          <p className="text-gray-600 mb-8">
            We couldn't find an email address to verify. Please login or register first.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition shadow-md"
            >
              Go to Login
            </Link>
            <Link
              to="/register"
              className="flex-1 border-2 border-teal-600 text-teal-600 py-3 rounded-xl font-semibold hover:bg-teal-50 transition"
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
            <p className="text-teal-100">
              Secure access to your campus marketplace
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* Email Display */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-teal-600" />
              <p className="text-sm text-gray-600 font-medium">Verification code sent to</p>
            </div>
            <div className="flex items-center justify-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="font-mono font-bold text-lg text-gray-800 truncate max-w-[200px] sm:max-w-xs">
                {email}
              </p>
              <button
                onClick={handleCopyEmail}
                className="p-2 text-gray-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-gray-100"
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
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800">Successfully Verified!</p>
                  <p className="text-sm text-green-600">
                    Redirecting to {user ? 'dashboard' : 'login'} in {autoRedirectTimer}s
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-700">{autoRedirectTimer}</span>
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
                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
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
                      className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all ${
                        digit
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : activeIndex === index
                          ? "border-teal-400 ring-4 ring-teal-100"
                          : "border-gray-200 hover:border-teal-300"
                      } outline-none`}
                      disabled={loading || isVerified}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {/* Message Display */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <div className="flex items-center gap-3">
                    {message.type === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      message.type === "success" ? "text-green-700" : "text-red-700"
                    }`}>
                      {message.text}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || code.some(d => d === "")}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  loading || code.some(d => d === "")
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
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
              <p className="text-gray-600 text-center mb-4">
                Didn't receive the code?
              </p>
              
              {/* Resend Method Toggle */}
              <div className="flex justify-center gap-3 mb-6">
                <button
                  onClick={() => setResendMethod('email')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    resendMethod === 'email'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email</span>
                </button>
                <button
                  onClick={() => setResendMethod('sms')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    resendMethod === 'sms'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm font-medium">SMS</span>
                </button>
              </div>
              
              {cooldown > 0 ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span className="font-medium">
                    Resend in {formatCooldown(cooldown)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={resendLoading || !email}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-all border-2 border-teal-600 hover:border-teal-700"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend Code via {resendMethod === 'email' ? 'Email' : 'SMS'}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              {isVerified ? (
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold hover:from-teal-700 hover:to-cyan-700 transition shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  {user ? 'Go to Dashboard' : 'Go to Login'}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-3 rounded-xl border-2 border-teal-600 text-teal-600 text-center font-semibold hover:bg-teal-50 transition"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <MailCheck className="w-3 h-3" />
              Check spam folder if you don't see the email
            </p>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-1">
              <MessageSquare className="w-3 h-3" />
              Need help? <button className="text-teal-600 hover:underline">Contact Support</button>
            </p>
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