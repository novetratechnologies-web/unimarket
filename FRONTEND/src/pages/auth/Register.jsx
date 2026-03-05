// src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { 
  FiEye, 
  FiEyeOff, 
  FiCheck, 
  FiX, 
  FiExternalLink,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiUsers,
  FiGlobe,
  FiLock,
  FiAlertCircle,
  FiClock
} from "react-icons/fi";
import { api } from "../../api";
import logo from "../../assets/uni_logo.png";

const universities = [
  "Chuka University",
  "Meru University of Science and Technology",
  "Embu University",
  "Maseno University",
  "University of Nairobi",
  "Moi University",
  "Egerton University",
  "Kenyatta University",
  "Jomo Kenyatta University of Agriculture and Technology",
  "Tom Mboya University",
  "Kisii University",
  "Laikipia University",
  "Rongo University",
  "Karatina University",
  "Machakos University",
  "South Eastern Kenya University",
  "Pwani University",
  "Technical University of Kenya",
  "Masinde Muliro University of Science and Technology",
  "University of Eldoret",
  "Dedan Kimathi University of Technology",
  "Taita Taveta University",
  "Garissa University",
  "Alupe University",
  "Murang'a University of Technology",
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer not to say', label: 'Prefer not to say' }
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternativePhone: "",
    university: "",
    username: "",
    dateOfBirth: "",
    gender: "prefer not to say",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [rateLimit, setRateLimit] = useState({
    isLimited: false,
    retryAfter: 0
  });
  
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    university: false,
    password: false,
    confirmPassword: false,
    username: false,
    dateOfBirth: false,
  });

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

  // Password validation matching backend exactly
  const validatePassword = (password) => {
    return {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  // Username validation
  const validateUsername = (username) => {
    if (!username) return false;
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
  };

  // Phone validation
  const validatePhone = (phone) => {
    if (!phone) return false;
    return /^\+?[\d\s-()]{10,}$/.test(phone);
  };

  // Date of birth validation (must be at least 13 years old)
  const validateDateOfBirth = (date) => {
    if (!date) return true; // Optional field
    
    const today = new Date();
    const birthDate = new Date(date);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 13;
    }
    return age >= 13 && birthDate <= today;
  };

  // Email validation
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "password") {
      setPasswordStrength(validatePassword(value));
    }

    if (name === "username" && value.length >= 3) {
      // Debounce username check
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }

    // Clear email exists flag when email changes
    if (name === "email") {
      setEmailExists(false);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    
    // Check email on blur
    if (field === 'email' && validateEmail(form.email)) {
      checkEmailAvailability(form.email);
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!validateUsername(username)) {
      setUsernameAvailable(false);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await api.get(`/auth/check-username?username=${username}`);
      const available = response.data?.available ?? response.data?.success ?? false;
      setUsernameAvailable(available);
    } catch (error) {
      console.error("Username check failed:", error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email) => {
    setCheckingEmail(true);
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      const exists = response.data?.exists ?? response.data?.success === false;
      setEmailExists(exists);
    } catch (error) {
      console.error("Email check failed:", error);
      if (error.response?.status === 404) {
        console.log("Email check endpoint not implemented");
      }
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone, university, password, confirmPassword, username, dateOfBirth } = form;

    // Required fields validation
    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ text: "Please enter your full name", type: "error" });
      return false;
    }

    if (!validateEmail(email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return false;
    }

    if (!validatePhone(phone)) {
      setMessage({ text: "Please enter a valid phone number (+254 XXX XXX XXX)", type: "error" });
      return false;
    }

    if (!university) {
      setMessage({ text: "Please select your university", type: "error" });
      return false;
    }

    // Username validation (optional but if provided must be valid)
    if (username && !validateUsername(username)) {
      setMessage({ text: "Username must be 3-30 characters and can only contain letters, numbers, and underscores", type: "error" });
      return false;
    }

    if (username && usernameAvailable === false) {
      setMessage({ text: "Username is already taken", type: "error" });
      return false;
    }

    // Date of birth validation (optional)
    if (dateOfBirth && !validateDateOfBirth(dateOfBirth)) {
      setMessage({ text: "You must be at least 13 years old to register", type: "error" });
      return false;
    }

    // Password validation
    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long", type: "error" });
      return false;
    }

    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return false;
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
        type: "error" 
      });
      return false;
    }

    if (!agreeToTerms) {
      setMessage({ text: "Please agree to the Terms and Conditions", type: "error" });
      return false;
    }

    if (rateLimit.isLimited) {
      setMessage({ 
        text: `Too many attempts. Please wait ${rateLimit.retryAfter} seconds.`, 
        type: "error" 
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submissionData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        alternativePhone: form.alternativePhone?.trim() || undefined,
        university: form.university,
        username: form.username?.trim().toLowerCase() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender,
        password: form.password,
        confirmPassword: form.confirmPassword
      };

      console.log("Submitting registration data:", {
        ...submissionData,
        password: "[HIDDEN]",
        confirmPassword: "[HIDDEN]"
      });

      const response = await api.post("/auth/register", submissionData);
      
      console.log("Registration response:", response);

      if (response.data?.success || response.success || response.data?.user) {
        const successMessage = response.data?.message || response.message || "Registration successful! Check your email for verification code.";
        
        setMessage({ 
          text: successMessage, 
          type: "success" 
        });
        
        // Store email for verification page
        localStorage.setItem('pendingVerificationEmail', form.email.toLowerCase().trim());
        
        // Redirect to verification page
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(form.email.toLowerCase().trim())}`);
        }, 1500);
      } else {
        handleRegistrationError(response.data || response);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      handleRegistrationError(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationError = (data) => {
    // Handle different error formats
    if (data.requirements) {
      const failedRequirements = [];
      if (!data.requirements.hasUpperCase) failedRequirements.push("uppercase");
      if (!data.requirements.hasLowerCase) failedRequirements.push("lowercase");
      if (!data.requirements.hasNumber) failedRequirements.push("number");
      if (!data.requirements.hasSpecialChar) failedRequirements.push("special character");
      
      setMessage({ 
        text: `Password must contain: ${failedRequirements.join(", ")}`, 
        type: "error" 
      });
    } 
    else if (data.errors) {
      const errorMessages = Array.isArray(data.errors) 
        ? data.errors.map(err => err.msg || err.message).join(', ')
        : JSON.stringify(data.errors);
      
      setMessage({ 
        text: errorMessages || "Registration failed. Please try again.", 
        type: "error" 
      });
    } 
    else if (data.message) {
      setMessage({ text: data.message, type: "error" });
    } 
    else if (data.error) {
      setMessage({ text: data.error, type: "error" });
    } 
    else {
      setMessage({ text: "Registration failed. Please try again.", type: "error" });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setMessage({ text: "", type: "" });
      
      // 🔥 FIXED: Production Google Auth URL
      window.location.href = `https://unimarket-vtx5.onrender.com/api/auth/google`;
    } catch (error) {
      setMessage({ 
        text: "Google authentication failed. Please try again.", 
        type: "error" 
      });
      setGoogleLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-gray-400"}`}>
      {met ? <FiCheck className="flex-shrink-0" /> : <FiX className="flex-shrink-0" />}
      <span>{text}</span>
    </div>
  );

  const isFormValid = () => {
    const isStrongPassword = Object.values(passwordStrength).every(Boolean);
    const isUsernameValid = !form.username || (validateUsername(form.username) && usernameAvailable !== false);
    
    return form.firstName && 
           form.lastName && 
           validateEmail(form.email) && 
           validatePhone(form.phone) && 
           form.university && 
           form.password && 
           form.confirmPassword && 
           form.password === form.confirmPassword && 
           isStrongPassword && 
           isUsernameValid &&
           agreeToTerms &&
           !rateLimit.isLimited;
  };

  const TermsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Terms and Conditions</h3>
            <button
              onClick={() => setShowTermsModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h4>
            <p className="text-gray-600 text-sm">
              By creating an account on UniMarket, you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">2. User Responsibilities</h4>
            <p className="text-gray-600 text-sm">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">3. Marketplace Rules</h4>
            <p className="text-gray-600 text-sm">
              All items listed for sale must be legal and appropriate for a university community. 
              Prohibited items include but are not limited to: alcohol, drugs, weapons, and stolen property.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">4. Privacy Policy</h4>
            <p className="text-gray-600 text-sm">
              Your privacy is important to us. We collect and use your personal information in accordance 
              with our Privacy Policy to provide and improve our services.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">5. University Verification</h4>
            <p className="text-gray-600 text-sm">
              By registering, you confirm that you are currently enrolled in the selected university 
              and agree to maintain appropriate conduct as a member of the university community.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">6. Age Requirement</h4>
            <p className="text-gray-600 text-sm">
              You confirm that you are at least 13 years of age to use this service.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">7. Data Collection</h4>
            <p className="text-gray-600 text-sm">
              We collect personal information including name, email, phone number, and university affiliation 
              to provide and secure our services. This data is stored securely and never shared with third parties.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={() => setShowTermsModal(false)}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition"
          >
            I Understand and Agree
          </button>
        </div>
      </div>
    </div>
  );

  const InputError = ({ message }) => (
    message ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><FiAlertCircle /> {message}</p> : null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-100 px-4 py-8">
      {showTermsModal && <TermsModal />}
      
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-2xl border border-teal-100">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-teal-100 p-3 rounded-2xl mb-3">
            <img src={logo} alt="UniMarket Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            UniMarket
          </h1>
          <p className="text-gray-600 text-sm mt-1">Join the Student Marketplace</p>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Create Your Account
        </h2>

        {/* Rate Limit Warning */}
        {rateLimit.isLimited && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <FiClock className="text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700 font-medium">
                Too many attempts. Please wait {rateLimit.retryAfter} seconds.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Fields - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('firstName')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    touched.firstName && !form.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="John"
                  required
                />
              </div>
              {touched.firstName && !form.firstName && (
                <InputError message="First name is required" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('lastName')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    touched.lastName && !form.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Doe"
                  required
                />
              </div>
              {touched.lastName && !form.lastName && (
                <InputError message="Last name is required" />
              )}
            </div>
          </div>

          {/* Email and Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    touched.email && !validateEmail(form.email) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="john.doe@university.ac.ke"
                  required
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {touched.email && !validateEmail(form.email) && (
                <InputError message="Please enter a valid email address" />
              )}
              {emailExists && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <FiAlertCircle /> This email is already registered
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username (Optional)
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  onBlur={() => handleBlur('username')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    touched.username && form.username && !validateUsername(form.username) 
                      ? 'border-red-300 bg-red-50' 
                      : form.username && usernameAvailable === true 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="john_doe_2024"
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {!checkingUsername && usernameAvailable === true && form.username && (
                  <FiCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                )}
                {!checkingUsername && usernameAvailable === false && form.username && (
                  <FiX className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                )}
              </div>
              {touched.username && form.username && !validateUsername(form.username) && (
                <InputError message="3-30 characters, letters, numbers, underscores only" />
              )}
              {form.username && usernameAvailable === false && (
                <InputError message="Username is already taken" />
              )}
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    touched.phone && !validatePhone(form.phone) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="+254 712 345 678"
                  required
                />
              </div>
              {touched.phone && !validatePhone(form.phone) && (
                <InputError message="Please enter a valid phone number" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alternative Phone (Optional)
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="alternativePhone"
                  value={form.alternativePhone}
                  onChange={handleChange}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                  placeholder="+254 712 345 679"
                />
              </div>
            </div>
          </div>

          {/* University and Date of Birth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                University <span className="text-red-500">*</span>
              </label>
              <select
                name="university"
                value={form.university}
                onChange={handleChange}
                onBlur={() => handleBlur('university')}
                disabled={rateLimit.isLimited}
                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none bg-white ${
                  touched.university && !form.university ? 'border-red-300 bg-red-50' : 'border-gray-300'
                } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">Select Your University</option>
                {universities.map((uni, idx) => (
                  <option key={idx} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
              {touched.university && !form.university && (
                <InputError message="Please select your university" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (Optional)
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  onBlur={() => handleBlur('dateOfBirth')}
                  disabled={rateLimit.isLimited}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    form.dateOfBirth && !validateDateOfBirth(form.dateOfBirth) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
              {form.dateOfBirth && !validateDateOfBirth(form.dateOfBirth) && (
                <InputError message="You must be at least 13 years old" />
              )}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <div className="relative">
              <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                disabled={rateLimit.isLimited}
                className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none bg-white ${
                  rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                }`}
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={rateLimit.isLimited}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={rateLimit.isLimited}
                  className={`w-full border rounded-lg pl-10 pr-10 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition ${
                    touched.confirmPassword && form.password !== form.confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  } ${rateLimit.isLimited ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={rateLimit.isLimited}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && form.password !== form.confirmPassword && (
                <InputError message="Passwords do not match" />
              )}
            </div>
          </div>

          {/* Password Requirements */}
          {form.password && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiLock className="text-teal-600" />
                Password Requirements:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <PasswordRequirement met={passwordStrength.hasMinLength} text="At least 8 characters" />
                <PasswordRequirement met={passwordStrength.hasUpperCase} text="One uppercase letter" />
                <PasswordRequirement met={passwordStrength.hasLowerCase} text="One lowercase letter" />
                <PasswordRequirement met={passwordStrength.hasNumber} text="One number" />
                <PasswordRequirement met={passwordStrength.hasSpecialChar} text="One special character (!@#$%^&*)" />
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              disabled={rateLimit.isLimited}
              className="mt-1 text-teal-600 focus:ring-teal-500 rounded disabled:opacity-50"
            />
            <label htmlFor="terms" className="text-sm text-gray-700 flex-1">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-teal-600 hover:text-teal-700 font-medium hover:underline inline-flex items-center gap-1"
              >
                Terms and Conditions
                <FiExternalLink size={14} />
              </button>{" "}
              and confirm that I am a current student of the selected university and at least 13 years of age.
            </label>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`p-4 rounded-lg text-sm font-medium flex items-start gap-3 ${
                message.type === "success" 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.type === "success" ? <FiCheck className="mt-0.5" /> : <FiAlertCircle className="mt-0.5" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading || !isFormValid()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </div>
            ) : (
              "Create Account"
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
          disabled={googleLoading || rateLimit.isLimited}
          className={`w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg transition-all duration-200 font-medium ${
            googleLoading || rateLimit.isLimited
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-50 hover:shadow-md"
          }`}
        >
          {googleLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Connecting...
            </div>
          ) : (
            <>
              <FcGoogle className="text-xl" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition"
            >
              Sign in here
            </Link>
          </p>
          
          <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
            <FiGlobe className="text-teal-600" />
            By joining, you become part of Kenya's largest student community
          </p>
        </div>
      </div>
    </div>
  );
}