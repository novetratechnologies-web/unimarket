// src/contexts/AuthContext.jsx - FIXED VERSION
import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { api } from '../api';
import config from '../config/env';
import { AUTH_KEYS, API_ENDPOINTS, TOKEN_CONFIG } from '../constants/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const refreshPromise = useRef(null);
  const refreshTimeout = useRef(null);
  const csrfToken = useRef(null);

  // Constants from config
  const apiBaseURL = config.api?.baseURL || 'http://localhost:5000/api';
  const appBaseURL = config.app?.baseURL || 'http://localhost:5174';
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('🔧 AuthContext initialized:', {
    isProduction,
    apiBaseURL,
    appBaseURL,
  });

  // Helper to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Secure token storage management
  const tokenService = {
    getStoredTokens: () => {
      if (isProduction) {
        // In production, get from secure cookies
        const accessToken = getCookie('accessToken');
        const refreshToken = getCookie('refreshToken');
        if (accessToken && refreshToken) {
          return { access: accessToken, refresh: refreshToken };
        }
      } else {
        // In development, use sessionStorage
        try {
          const stored = sessionStorage.getItem(AUTH_KEYS.TOKENS);
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      }
      return null;
    },

    setTokens: (tokensData) => {
      console.log('🔐 Setting tokens:', { 
        hasAccess: !!tokensData?.access,
        hasRefresh: !!tokensData?.refresh 
      });
      
      if (isProduction) {
        // Secure cookies with strict settings
        const cookieOptions = 'Secure; HttpOnly; SameSite=Strict; Path=/';
        document.cookie = `accessToken=${tokensData.access}; ${cookieOptions}; Max-Age=${TOKEN_CONFIG.ACCESS_EXPIRY}`;
        document.cookie = `refreshToken=${tokensData.refresh}; ${cookieOptions}; Max-Age=${TOKEN_CONFIG.REFRESH_EXPIRY}`;
      } else {
        // Development: sessionStorage
        sessionStorage.setItem(AUTH_KEYS.TOKENS, JSON.stringify({
          ...tokensData,
          storedAt: Date.now()
        }));
      }
    },

    clearTokens: () => {
      console.log('🗑️ Clearing tokens');
      if (isProduction) {
        // Clear secure cookies
        document.cookie = 'accessToken=; Max-Age=0; Path=/';
        document.cookie = 'refreshToken=; Max-Age=0; Path=/';
      } else {
        // Clear development storage
        sessionStorage.removeItem(AUTH_KEYS.TOKENS);
      }
    },

    getCSRFToken: () => {
      if (!csrfToken.current) {
        csrfToken.current = getCookie('XSRF-TOKEN') || getCookie('csrf_token');
      }
      return csrfToken.current;
    },

    setCSRFToken: (token) => {
      csrfToken.current = token;
      // Also set as cookie for consistency
      document.cookie = `csrf_token=${token}; Path=/; SameSite=Strict`;
    }
  };

  // User data storage management
  const userService = {
    getStoredUser: () => {
      try {
        const stored = sessionStorage.getItem(AUTH_KEYS.USER_DATA);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },

    setUser: (userData) => {
      console.log('👤 Setting user data:', { 
        email: userData?.email,
        isVerified: userData?.isVerified 
      });
      
      // Only store non-sensitive user data
      const safeUserData = {
        id: userData?.id || userData?._id,
        email: userData?.email,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        isVerified: userData?.isVerified || false,
        university: userData?.university,
        phone: userData?.phone,
        avatar: userData?.avatar,
        role: userData?.role || 'user'
      };
      
      sessionStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(safeUserData));
      setUser(safeUserData);
      
      // Check if user needs verification
      if (!safeUserData.isVerified) {
        console.log('⚠️ User is not verified');
        setAuthError('EMAIL_NOT_VERIFIED');
      }
    },

    clearUser: () => {
      console.log('🗑️ Clearing user data');
      sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
      setUser(null);
      setAuthError(null);
    },

    updateUser: (updates) => {
      const currentUser = userService.getStoredUser() || user;
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        userService.setUser(updatedUser);
      }
    }
  };

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) {
      console.log('❌ No token provided');
      return true;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = TOKEN_CONFIG.REFRESH_THRESHOLD;
      
      const isExpired = currentTime + bufferTime >= expiryTime;
      console.log('🔍 Token expiry check:', {
        expiryTime: new Date(expiryTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        isExpired,
        bufferTime
      });
      
      return isExpired;
    } catch (error) {
      console.error('❌ Failed to parse token:', error);
      return true;
    }
  };

  const scheduleTokenRefresh = (accessToken) => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }
    
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const refreshTime = expiryTime - TOKEN_CONFIG.REFRESH_THRESHOLD;
      const timeUntilRefresh = Math.max(0, refreshTime - Date.now());
      
      console.log('⏰ Scheduling token refresh in:', {
        timeUntilRefresh: `${Math.round(timeUntilRefresh / 1000)}s`,
        expiryTime: new Date(expiryTime).toISOString()
      });
      
      if (timeUntilRefresh > 0) {
        refreshTimeout.current = setTimeout(async () => {
          console.log('🔄 Time to refresh token...');
          const currentTokens = tokenService.getStoredTokens();
          if (currentTokens?.refresh) {
            await refreshToken(currentTokens.refresh);
          }
        }, timeUntilRefresh);
      } else {
        console.log('⚠️ Token already needs refresh');
      }
    } catch (error) {
      console.warn('Failed to schedule token refresh:', error);
    }
  };

  const refreshToken = async (refreshTokenValue) => {
    // Prevent multiple concurrent refresh attempts
    if (refreshPromise.current) {
      console.log('🔄 Already refreshing, waiting for existing promise...');
      return refreshPromise.current;
    }
    
    refreshPromise.current = (async () => {
      try {
        const csrfTokenValue = tokenService.getCSRFToken();
        console.log('🔄 Attempting token refresh...');
        
        const response = await api.post(API_ENDPOINTS.REFRESH, { 
          refresh: refreshTokenValue 
        }, {
          headers: { 
            'X-Refresh-Token': 'true',
            ...(csrfTokenValue && { 'X-CSRF-Token': csrfTokenValue })
          }
        });
        
        console.log('🔄 Token refresh response:', response);
        
        if (response.success) {
          const newTokens = response.data.tokens;
          
          // Update tokens
          tokenService.setTokens(newTokens);
          api.setHeader('Authorization', `Bearer ${newTokens.access}`);
          
          // Schedule next refresh
          scheduleTokenRefresh(newTokens.access);
          
          console.log('✅ Token refresh successful');
          return newTokens;
        } else {
          console.error('❌ Token refresh failed - success false:', response.message);
          throw new Error(response.message || 'Token refresh failed');
        }
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        
        // If refresh fails, clear auth and redirect to login
        if (error.message?.includes('401') || error.message?.includes('Invalid') || error.message?.includes('expired')) {
          console.log('❌ Refresh token invalid, logging out...');
          clearAuth();
          window.location.href = `${appBaseURL}/login?session=expired`;
        }
        
        throw error;
      } finally {
        refreshPromise.current = null;
      }
    })();
    
    return refreshPromise.current;
  };

  const clearAuth = () => {
    console.log('🧹 Clearing all auth data');
    tokenService.clearTokens();
    userService.clearUser();
    api.removeHeader('Authorization');
    
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication state...');
        
        const storedTokens = tokenService.getStoredTokens();
        const storedUser = userService.getStoredUser();
        
        console.log('🔍 Stored data:', {
          hasTokens: !!storedTokens,
          hasUser: !!storedUser,
          tokens: storedTokens,
          user: storedUser
        });
        
        if (storedTokens && storedUser) {
          // Set user immediately for better UX
          userService.setUser(storedUser);
          
          // Check if access token needs refresh
          if (isTokenExpired(storedTokens.access)) {
            console.log('🔄 Access token expired or near expiry, refreshing...');
            try {
              const newTokens = await refreshToken(storedTokens.refresh);
              if (newTokens) {
                api.setHeader('Authorization', `Bearer ${newTokens.access}`);
                console.log('✅ Auth initialized with refreshed tokens');
              } else {
                console.log('❌ Token refresh returned null, clearing auth');
                clearAuth();
              }
            } catch (error) {
              console.error('❌ Token refresh failed during init:', error);
              clearAuth();
            }
          } else {
            // Token is still valid
            console.log('✅ Access token still valid');
            api.setHeader('Authorization', `Bearer ${storedTokens.access}`);
            scheduleTokenRefresh(storedTokens.access);
          }
        } else {
          console.log('⚠️ No stored auth data found');
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const csrfTokenValue = tokenService.getCSRFToken();
      console.log('📤 Sending login request...');
      
      const response = await api.post(API_ENDPOINTS.LOGIN, { 
        email: email.toLowerCase().trim(), 
        password 
      }, {
        headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
      });
      
      console.log('📨 Login API response:', response);
      
      // Check if login was successful
      if (!response.success) {
        console.error('❌ Login failed - response success false:', response);
        
        // Check if email needs verification
        if (response.code === 'EMAIL_NOT_VERIFIED' || response.message?.includes('verify')) {
          console.log('⚠️ User needs email verification');
          throw { 
            message: response.message || 'Please verify your email first.',
            code: 'EMAIL_NOT_VERIFIED',
            email: email
          };
        }
        
        throw new Error(response.message || response.error || 'Login failed');
      }
      
      // Extract data from response
      const { user: userData, tokens: tokensData, csrfToken: responseCsrfToken } = response.data;
      
      console.log('👤 User data received:', { 
        email: userData?.email,
        isVerified: userData?.isVerified,
        hasTokens: !!tokensData
      });
      
      if (!userData || !tokensData) {
        console.error('❌ Missing user or tokens in response');
        throw new Error('Invalid response from server');
      }
      
      // Check if user is verified
      if (!userData.isVerified) {
        console.log('⚠️ User is not verified, storing email for verification');
        
        // Store the email for verification page
        sessionStorage.setItem('pending_verification_email', email);
        
        // Don't set auth tokens, user needs to verify first
        throw { 
          message: 'Please verify your email before logging in.',
          code: 'EMAIL_NOT_VERIFIED',
          email: email,
          requiresVerification: true
        };
      }
      
      // Store data (only if verified)
      tokenService.setTokens(tokensData);
      userService.setUser(userData);
      
      // Set authorization header
      api.setHeader('Authorization', `Bearer ${tokensData.access}`);
      
      // Schedule token refresh
      scheduleTokenRefresh(tokensData.access);
      
      // Store CSRF token if provided
      if (responseCsrfToken) {
        console.log('🔐 CSRF token received');
        tokenService.setCSRFToken(responseCsrfToken);
      }
      
      console.log('✅ Login successful for:', userData.email);
      
      return {
        success: true,
        user: userData,
        tokens: tokensData,
        requiresVerification: false
      };
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // If it's a verification error, re-throw it so the component can handle it
      if (error.code === 'EMAIL_NOT_VERIFIED' || error.requiresVerification) {
        throw error;
      }
      
      // Provide user-friendly error messages for other errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.message?.includes('401') || error.message?.includes('Invalid')) {
        errorMessage = 'Invalid email or password.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const googleLogin = () => {
    console.log('🔗 Redirecting to Google OAuth...');
    
    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    
    // Redirect to Google OAuth
    window.location.href = `${apiBaseURL}${API_ENDPOINTS.GOOGLE_AUTH}?state=${state}&redirect=${encodeURIComponent(window.location.origin)}`;
  };

  const completeGoogleProfile = async (profileData) => {
    try {
      const csrfTokenValue = tokenService.getCSRFToken();
      console.log('📝 Completing Google profile...');
      
      const response = await api.post(API_ENDPOINTS.COMPLETE_PROFILE, profileData, {
        headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
      });
      
      console.log('📝 Complete profile response:', response);
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Profile completion failed');
      }
      
      const { user: updatedUser, tokens: newTokens } = response.data;
      
      tokenService.setTokens(newTokens);
      userService.setUser(updatedUser);
      api.setHeader('Authorization', `Bearer ${newTokens.access}`);
      scheduleTokenRefresh(newTokens.access);
      
      return response.data;
    } catch (error) {
      console.error('Complete Google profile error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const csrfTokenValue = tokenService.getCSRFToken();
      console.log('📝 Updating user profile...');
      
      const response = await api.put('/auth/profile', profileData, {
        headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
      });
      
      console.log('📝 Update profile response:', response);
      
      if (!response.success) {
        throw new Error(response.message || response.error || 'Profile update failed');
      }
      
      const updatedUser = response.data.user;
      userService.updateUser(updatedUser);
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const currentTokens = tokenService.getStoredTokens();
      const csrfTokenValue = tokenService.getCSRFToken();
      
      if (currentTokens?.refresh) {
        console.log('🚪 Attempting server logout...');
        await api.post(API_ENDPOINTS.LOGOUT, { 
          refresh: currentTokens.refresh 
        }, {
          headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
        });
        console.log('✅ Server logout successful');
      }
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      clearAuth();
      
      // Redirect to login
      window.location.href = `${appBaseURL}/login?session=logged_out`;
    }
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const response = await api.get(API_ENDPOINTS.ME);
      
      if (response.success) {
        const userData = response.data.user || response.data;
        userService.setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value = {
    user,
    authError,
    login,
    googleLogin,
    logout,
    loading,
    updateUserProfile,
    completeGoogleProfile,
    refreshUser,
    isAuthenticated: () => {
      const currentTokens = tokenService.getStoredTokens();
      const currentUser = userService.getStoredUser();
      const authenticated = !!(currentUser && currentTokens && !isTokenExpired(currentTokens.access));
      
      console.log('🔍 isAuthenticated check:', {
        hasUser: !!currentUser,
        hasTokens: !!currentTokens,
        isVerified: currentUser?.isVerified,
        authenticated
      });
      
      return authenticated;
    },
    requiresVerification: () => {
      const currentUser = userService.getStoredUser();
      return !!(currentUser && !currentUser.isVerified);
    },
    getVerificationEmail: () => {
      return sessionStorage.getItem('pending_verification_email') || user?.email;
    },
    clearVerificationEmail: () => {
      sessionStorage.removeItem('pending_verification_email');
    },
    clearSession: clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-100">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading UniMarket...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}