// src/pages/auth/AuthSuccess.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, CheckCircle, AlertCircle, Loader } from "lucide-react";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData, user } = useAuth();
  const processed = useRef(false);
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthSuccess = async () => {
      // Prevent double processing
      if (processed.current) return;
      processed.current = true;

      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const refresh = params.get('refresh');
      const userParam = params.get('user');
      const requiresProfile = params.get('requiresProfile') === 'true';
      const error = params.get('error');

      console.log('🔐 Auth callback received:', {
        hasToken: !!token,
        hasRefresh: !!refresh,
        hasUser: !!userParam,
        requiresProfile,
        error
      });

      // Handle error cases
      if (error) {
        console.error('❌ OAuth error:', error);
        setStatus('error');
        setMessage('Authentication failed. Redirecting to login...');
        
        setTimeout(() => navigate('/login', { 
          state: { message: 'Google authentication failed. Please try again.' }
        }), 2000);
        return;
      }

      // Handle token reception
     if (token && refresh) {
  try {
    setStatus('processing');
    
    // Parse user data if provided
    let userData = null;
    if (userParam && userParam !== '{}' && userParam !== 'null') {
      try {
        userData = JSON.parse(decodeURIComponent(userParam));
        console.log('👤 User data from URL:', userData);
      } catch (e) {
        console.warn('Failed to parse user data:', e);
      }
    } else {
      console.log('⚠️ No user data in URL, will fetch from API');
    }

    // Store tokens
    if (import.meta.env.PROD) {
      console.log('✅ Using HttpOnly cookies');
      if (userData) {
        sessionStorage.setItem('userData', JSON.stringify(userData));
      }
    } else {
      sessionStorage.setItem('authTokens', JSON.stringify({
        access: token,
        refresh: refresh,
        storedAt: Date.now()
      }));
      
      if (userData) {
        sessionStorage.setItem('userData', JSON.stringify(userData));
      }
    }

    // Update auth context
    if (setAuthData) {
      setAuthData({ token, refresh, user: userData });
    }

    setStatus('success');
    
    setTimeout(() => {
      if (requiresProfile) {
        // Even if user data is empty, pass what we have
        navigate('/complete-profile', { 
          state: { 
            message: 'Please complete your profile to continue.',
            token: token,
            refresh: refresh,
            user: userData
          }
        });
      } else {
        navigate('/dashboard', { 
          replace: true,
          state: { message: 'Successfully logged in with Google!' }
        });
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error processing auth:', error);
    setStatus('error');
    setMessage('Failed to process authentication. Redirecting...');
    
    setTimeout(() => navigate('/login', { 
      state: { message: 'Authentication failed. Please try again.' }
    }), 2000);
  }
}
  };

    handleAuthSuccess();
  }, [location, navigate, setAuthData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Status-based UI */}
        {status === 'processing' && (
          <>
            {/* Animated Logo */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-25"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center">
                  <Loader className="w-12 h-12 text-white animate-spin" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Completing Login
            </h1>

            <p className="text-gray-600 mb-8">
              Please wait while we securely log you in...
            </p>

            {/* Progress Steps */}
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying credentials</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                <span>Loading your profile</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                <span>Redirecting to dashboard</span>
              </div>
            </div>

            {/* Email Display (if available) */}
            {user?.email && (
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-700 truncate">
                  Logging in as {user.email}
                </span>
              </div>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Login Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              {message || 'You have been successfully authenticated.'}
            </p>
            <p className="text-sm text-gray-400">
              Redirecting you to the dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-6">
              {message || 'An error occurred during authentication.'}
            </p>
            <p className="text-sm text-gray-400">
              Redirecting you to login page...
            </p>
          </>
        )}

        {/* Tip - only show during processing */}
        {status === 'processing' && (
          <p className="text-xs text-gray-400 mt-8">
            You'll be redirected automatically. Do not close this window.
          </p>
        )}
      </div>
    </div>
  );
}