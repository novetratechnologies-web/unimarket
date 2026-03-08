import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  ShoppingBag,
  Store,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Clear errors when form data changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors };
      if (formData.email) delete newErrors.email;
      if (formData.password) delete newErrors.password;
      setErrors(newErrors);
    }
  }, [formData.email, formData.password]);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setTouched({ email: true, password: true });
    return;
  }
  
  setIsLoading(true);
  
  try {
    console.log('📤 Calling login with:', formData.email);
    const result = await login(formData);
    console.log('📥 Login result from context:', result);
    
    if (result.success) {
      console.log('✅ Login successful, user:', result.data);
      
      showToast({
        title: 'Welcome back!',
        description: `Signed in as ${formData.email}`,
        type: 'success',
        duration: 5000
      });
      
      // Navigate to dashboard or previous page
      navigate(from, { replace: true });
    } else {
      console.error('❌ Login failed:', result.error);
      setErrors({ submit: result.error });
      showToast({
        title: 'Authentication failed',
        description: result.error,
        type: 'error',
        duration: 5000
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    const errorMessage = error.message || 'An unexpected error occurred';
    setErrors({ submit: errorMessage });
    showToast({
      title: 'Login failed',
      description: errorMessage,
      type: 'error',
      duration: 5000
    });
  } finally {
    setIsLoading(false);
  }
};

  const isFieldInvalid = (fieldName) => {
    return touched[fieldName] && errors[fieldName];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Stats Cards */}
      <div className="absolute inset-0 hidden lg:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute top-20 left-20 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-300">Total Revenue</p>
              <p className="text-lg font-bold text-white">$2.4M</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-20 right-20 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-300">Active Users</p>
              <p className="text-lg font-bold text-white">1,284</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="absolute top-40 right-40 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-300">Active Vendors</p>
              <p className="text-lg font-bold text-white">156</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-blue-400 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-600 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-center"
        >
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-lg text-gray-300">
            Sign in to access your dashboard
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-white/10 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          {/* Form Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary-400" />
              <span className="text-sm font-medium text-gray-200">Secure Login</span>
            </div>
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 border-2 border-white/30 flex items-center justify-center">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-white/30 flex items-center justify-center">
                <span className="text-xs font-bold text-white">V</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {errors.submit && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">
                      Authentication Failed
                    </p>
                    <p className="text-sm text-red-300 mt-1">
                      {errors.submit}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${isFieldInvalid('email') ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 bg-white/5 border ${
                    isFieldInvalid('email') 
                      ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' 
                      : 'border-white/10 focus:ring-primary-500 focus:border-primary-500'
                  } rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 transition-all`}
                  placeholder="admin@company.com"
                />
                {isFieldInvalid('email') && (
                  <p className="mt-2 text-xs text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${isFieldInvalid('password') ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-10 py-3 bg-white/5 border ${
                    isFieldInvalid('password') 
                      ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' 
                      : 'border-white/10 focus:ring-primary-500 focus:border-primary-500'
                  } rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                  )}
                </button>
                {isFieldInvalid('password') && (
                  <p className="mt-2 text-xs text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 bg-white/5 border-white/20 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 focus:ring-2 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="relative w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              {isLoading || authLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-xs text-gray-400">256-bit encrypted connection</span>
            </div>
          </form>

          {/* Company Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">Unimarket Admin</span>
              </div>
              <div className="flex space-x-4">
                <Link to="/privacy" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                  Terms
                </Link>
                <Link to="/support" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                  Support
                </Link>
              </div>
            </div>
            <p className="mt-4 text-xs text-center text-gray-600">
              © {new Date().getFullYear()} Unimarket. All rights reserved.
            </p>
          </div>
        </div>

        {/* Version Info */}
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-600">
            Version 2.0.0 • Secure Enterprise Login
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;