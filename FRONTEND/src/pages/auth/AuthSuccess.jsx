// src/pages/auth/AuthSuccess.jsx
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeGoogleProfile, user, loading } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    const handleAuthSuccess = async () => {
      // Prevent double processing
      if (processed.current) return;
      processed.current = true;

      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const refresh = params.get('refresh');
      const requiresProfile = params.get('requiresProfile') === 'true';
      const error = params.get('error');

      console.log('🔐 Auth callback received:', {
        hasToken: !!token,
        hasRefresh: !!refresh,
        requiresProfile,
        error
      });

      // Handle error cases
      if (error) {
        console.error('❌ OAuth error:', error);
        setTimeout(() => navigate('/login', { 
          state: { message: 'Google authentication failed. Please try again.' }
        }), 2000);
        return;
      }

      // Handle token reception
      if (token && refresh) {
        try {
          // Store tokens in localStorage/sessionStorage
          // The AuthContext will pick them up on next load
          if (import.meta.env.PROD) {
            // For production with HttpOnly cookies, the backend already set them
            console.log('✅ Tokens set via HttpOnly cookies');
          } else {
            // For development, store in sessionStorage
            sessionStorage.setItem('authTokens', JSON.stringify({
              access: token,
              refresh: refresh,
              storedAt: Date.now()
            }));
          }

          // Wait a moment for AuthContext to initialize
          setTimeout(async () => {
            // Check if user profile is complete
            if (requiresProfile) {
              // Redirect to complete profile page
              navigate('/complete-profile', { 
                state: { message: 'Please complete your profile to continue.' }
              });
            } else {
              // Redirect to dashboard
              navigate('/dashboard', { 
                replace: true,
                state: { message: 'Successfully logged in with Google!' }
              });
            }
          }, 500);
        } catch (error) {
          console.error('❌ Error processing auth:', error);
          navigate('/login', { 
            state: { message: 'Authentication failed. Please try again.' }
          });
        }
      } else {
        // No tokens - redirect to login
        console.warn('⚠️ No tokens received');
        navigate('/login', { 
          state: { message: 'Authentication failed. No tokens received.' }
        });
      }
    };

    handleAuthSuccess();
  }, [location, navigate, completeGoogleProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white animate-spin-slow" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Completing Login
        </h1>

        {/* Subtitle */}
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

        {/* Tip */}
        <p className="text-xs text-gray-400 mt-8">
          You'll be redirected automatically. Do not close this window.
        </p>
      </div>
    </div>
  );
}