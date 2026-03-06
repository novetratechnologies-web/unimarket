// src/contexts/AuthContext.jsx - PRODUCTION READY VERSION
import { createContext, useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../api';
import config from '../config/env';
import { AUTH_KEYS, API_ENDPOINTS, TOKEN_CONFIG } from '../constants/auth';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const refreshPromise = useRef(null);
  const refreshTimeout = useRef(null);
  const csrfToken = useRef(null);
  const authCheckInProgress = useRef(false);

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
  const getCookie = useCallback((name) => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    } catch (error) {
      console.error('❌ Error reading cookie:', error);
      return null;
    }
  }, []);

  // ==================== TOKEN SERVICE ====================
  const tokenService = useMemo(() => ({
    getStoredTokens: () => {
      try {
        // ALWAYS check sessionStorage first (works in all environments)
        const stored = sessionStorage.getItem(AUTH_KEYS.TOKENS);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('📦 Found tokens in sessionStorage:', {
            hasAccess: !!parsed.access,
            hasRefresh: !!parsed.refresh,
            age: parsed.storedAt ? `${Math.round((Date.now() - parsed.storedAt)/1000)}s old` : 'unknown'
          });
          return parsed;
        }

        // In production, also check cookies as fallback (though HttpOnly cookies can't be read)
        if (isProduction) {
          const accessToken = getCookie('accessToken');
          const refreshToken = getCookie('refreshToken');
          if (accessToken && refreshToken) {
            console.log('🍪 Found tokens in cookies');
            // Store in sessionStorage for future use
            const tokens = { access: accessToken, refresh: refreshToken, storedAt: Date.now() };
            sessionStorage.setItem(AUTH_KEYS.TOKENS, JSON.stringify(tokens));
            return tokens;
          }
        }

        return null;
      } catch (error) {
        console.error('❌ Error getting stored tokens:', error);
        return null;
      }
    },

    setTokens: (tokensData) => {
      try {
        console.log('🔐 Setting tokens:', { 
          hasAccess: !!tokensData?.access,
          hasRefresh: !!tokensData?.refresh 
        });

        if (!tokensData?.access || !tokensData?.refresh) {
          console.error('❌ Invalid token data received');
          return false;
        }

        // ALWAYS store in sessionStorage (works in all environments)
        const tokensWithMeta = {
          ...tokensData,
          storedAt: Date.now()
        };
        sessionStorage.setItem(AUTH_KEYS.TOKENS, JSON.stringify(tokensWithMeta));
        console.log('✅ Tokens stored in sessionStorage');

        // In production, also set non-HttpOnly cookies as fallback
        if (isProduction) {
          document.cookie = `accessToken=${tokensData.access}; Path=/; SameSite=Strict; Secure; Max-Age=${TOKEN_CONFIG.ACCESS_EXPIRY}`;
          document.cookie = `refreshToken=${tokensData.refresh}; Path=/; SameSite=Strict; Secure; Max-Age=${TOKEN_CONFIG.REFRESH_EXPIRY}`;
          console.log('🍪 Tokens also set in cookies (fallback)');
        }

        return true;
      } catch (error) {
        console.error('❌ Error setting tokens:', error);
        return false;
      }
    },

    clearTokens: () => {
      try {
        console.log('🗑️ Clearing tokens');
        sessionStorage.removeItem(AUTH_KEYS.TOKENS);
        
        // Clear cookies
        document.cookie = 'accessToken=; Max-Age=0; Path=/';
        document.cookie = 'refreshToken=; Max-Age=0; Path=/';
        document.cookie = 'csrf_token=; Max-Age=0; Path=/';
      } catch (error) {
        console.error('❌ Error clearing tokens:', error);
      }
    },

    getCSRFToken: () => {
      if (!csrfToken.current) {
        csrfToken.current = getCookie('XSRF-TOKEN') || getCookie('csrf_token');
      }
      return csrfToken.current;
    },

    setCSRFToken: (token) => {
      try {
        csrfToken.current = token;
        document.cookie = `csrf_token=${token}; Path=/; SameSite=Strict${isProduction ? '; Secure' : ''}`;
      } catch (error) {
        console.error('❌ Error setting CSRF token:', error);
      }
    },

    refreshCSRFToken: async () => {
      try {
        const response = await api.get('/auth/csrf-token');
        if (response?.data?.csrfToken) {
          this.setCSRFToken(response.data.csrfToken);
          return response.data.csrfToken;
        }
      } catch (error) {
        console.error('❌ Error refreshing CSRF token:', error);
      }
      return null;
    }
  }), [isProduction, getCookie]);

  // ==================== USER SERVICE ====================
  const userService = useMemo(() => ({
    getStoredUser: () => {
      try {
        const stored = sessionStorage.getItem(AUTH_KEYS.USER_DATA);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('👤 Found user in sessionStorage:', { email: parsed.email });
          return parsed;
        }
        return null;
      } catch (error) {
        console.error('❌ Error getting stored user:', error);
        return null;
      }
    },

    setUser: (userData) => {
      try {
        console.log('👤 Setting user data:', { 
          email: userData?.email,
          isVerified: userData?.isVerified 
        });

        if (!userData) {
          this.clearUser();
          return false;
        }

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
          role: userData?.role || 'user',
          lastActive: userData?.lastActive || new Date().toISOString()
        };

        sessionStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(safeUserData));
        setUser(safeUserData);
        setIsAuthenticated(true);

        if (!safeUserData.isVerified) {
          console.log('⚠️ User is not verified');
          setAuthError('EMAIL_NOT_VERIFIED');
        } else {
          setAuthError(null);
        }

        return true;
      } catch (error) {
        console.error('❌ Error setting user:', error);
        return false;
      }
    },

    clearUser: () => {
      try {
        console.log('🗑️ Clearing user data');
        sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
      } catch (error) {
        console.error('❌ Error clearing user:', error);
      }
    },

    updateUser: (updates) => {
      try {
        const currentUser = this.getStoredUser() || user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          this.setUser(updatedUser);
        }
      } catch (error) {
        console.error('❌ Error updating user:', error);
      }
    }
  }), [user]);

  // ==================== TOKEN UTILITIES ====================
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;

    try {
      // Check if it's a JWT (has 3 parts)
      if (token.split('.').length !== 3) {
        console.warn('⚠️ Invalid token format');
        return true;
      }

      const payload = JSON.parse(atob(token.split('.')[1]));
      
      if (!payload.exp) {
        console.warn('⚠️ Token missing expiration');
        return true;
      }

      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const bufferTime = TOKEN_CONFIG.REFRESH_THRESHOLD || 5 * 60 * 1000; // 5 minutes default

      const isExpired = currentTime + bufferTime >= expiryTime;
      
      if (isExpired) {
        console.log('🔍 Token expired or near expiry:', {
          expiryTime: new Date(expiryTime).toISOString(),
          timeRemaining: Math.round((expiryTime - currentTime) / 1000) + 's'
        });
      }

      return isExpired;
    } catch (error) {
      console.error('❌ Failed to parse token:', error);
      return true;
    }
  }, []);

  const scheduleTokenRefresh = useCallback((accessToken) => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const refreshTime = expiryTime - (TOKEN_CONFIG.REFRESH_THRESHOLD || 5 * 60 * 1000);
      const timeUntilRefresh = Math.max(0, refreshTime - Date.now());

      if (timeUntilRefresh > 0 && timeUntilRefresh < 24 * 60 * 60 * 1000) {
        console.log('⏰ Scheduling token refresh in:', {
          timeUntilRefresh: `${Math.round(timeUntilRefresh / 1000)}s`,
          expiryTime: new Date(expiryTime).toISOString()
        });

        refreshTimeout.current = setTimeout(async () => {
          console.log('🔄 Time to refresh token...');
          const currentTokens = tokenService.getStoredTokens();
          if (currentTokens?.refresh) {
            try {
              await refreshToken(currentTokens.refresh);
            } catch (error) {
              console.error('❌ Scheduled token refresh failed:', error);
            }
          }
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.warn('Failed to schedule token refresh:', error);
    }
  }, [tokenService]);

  const refreshToken = useCallback(async (refreshTokenValue) => {
    if (refreshPromise.current) {
      console.log('🔄 Already refreshing, waiting...');
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

        if (response?.success && response.data?.tokens) {
          const newTokens = response.data.tokens;
          
          tokenService.setTokens(newTokens);
          api.setHeader('Authorization', `Bearer ${newTokens.access}`);
          scheduleTokenRefresh(newTokens.access);
          
          console.log('✅ Token refresh successful');
          return newTokens;
        } else {
          throw new Error(response?.message || 'Token refresh failed');
        }
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        
        if (error.response?.status === 401 || error.message?.includes('Invalid')) {
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
  }, [tokenService, scheduleTokenRefresh, appBaseURL]);

  const clearAuth = useCallback(() => {
    console.log('🧹 Clearing all auth data');
    tokenService.clearTokens();
    userService.clearUser();
    api.removeHeader('Authorization');
    csrfToken.current = null;

    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
      refreshTimeout.current = null;
    }
  }, [tokenService, userService]);

  // ==================== AUTH INITIALIZATION ====================
  useEffect(() => {
    if (authCheckInProgress.current) return;
    authCheckInProgress.current = true;

    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication state...');

        const storedTokens = tokenService.getStoredTokens();
        const storedUser = userService.getStoredUser();

        console.log('🔍 Stored data:', {
          hasTokens: !!storedTokens,
          hasUser: !!storedUser,
          tokens: storedTokens ? '✅' : '❌',
          user: storedUser ? '✅' : '❌'
        });

        if (storedTokens?.access && storedTokens?.refresh && storedUser) {
          // We have both tokens and user
          userService.setUser(storedUser);
          api.setHeader('Authorization', `Bearer ${storedTokens.access}`);

          if (isTokenExpired(storedTokens.access)) {
            console.log('🔄 Access token expired, refreshing...');
            try {
              const newTokens = await refreshToken(storedTokens.refresh);
              if (newTokens) {
                console.log('✅ Auth initialized with refreshed tokens');
              } else {
                clearAuth();
              }
            } catch (error) {
              console.error('❌ Token refresh failed:', error);
              clearAuth();
            }
          } else {
            console.log('✅ Access token still valid');
            scheduleTokenRefresh(storedTokens.access);
          }
        } else if (storedUser && !storedTokens) {
          // We have user but no tokens - possible cookie auth
          console.log('👤 User found without tokens - assuming cookie auth');
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          console.log('⚠️ No auth data found');
          clearAuth();
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        clearAuth();
      } finally {
        setLoading(false);
        authCheckInProgress.current = false;
      }
    };

    checkAuth();

    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, []);

  // ==================== LOGIN ====================
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);

      let csrfTokenValue = tokenService.getCSRFToken();
      if (!csrfTokenValue) {
        csrfTokenValue = await tokenService.refreshCSRFToken();
      }

      const response = await api.post(API_ENDPOINTS.LOGIN, {
        email: email.toLowerCase().trim(),
        password
      }, {
        headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
      });

      console.log('📨 Login response:', response);

      if (!response?.success) {
        if (response?.code === 'EMAIL_NOT_VERIFIED') {
          throw {
            message: response.message || 'Please verify your email first.',
            code: 'EMAIL_NOT_VERIFIED',
            email: email
          };
        }
        throw new Error(response?.message || 'Login failed');
      }

      const { user: userData, tokens: tokensData, csrfToken: responseCsrfToken } = response.data;

      if (!userData || !tokensData) {
        throw new Error('Invalid response from server');
      }

      if (!userData.isVerified) {
        sessionStorage.setItem('pending_verification_email', email);
        throw {
          message: 'Please verify your email before logging in.',
          code: 'EMAIL_NOT_VERIFIED',
          email: email,
          requiresVerification: true
        };
      }

      // Store auth data
      tokenService.setTokens(tokensData);
      userService.setUser(userData);
      api.setHeader('Authorization', `Bearer ${tokensData.access}`);

      if (responseCsrfToken) {
        tokenService.setCSRFToken(responseCsrfToken);
      }

      scheduleTokenRefresh(tokensData.access);

      // Force auth state update
      setIsAuthenticated(true);
      
      console.log('✅ Login successful for:', userData.email);

      return {
        success: true,
        user: userData,
        tokens: tokensData
      };
    } catch (error) {
      console.error('❌ Login error:', error);

      if (error.code === 'EMAIL_NOT_VERIFIED' || error.requiresVerification) {
        throw error;
      }

      // User-friendly error messages
      const errorMap = {
        'Network Error': 'Cannot connect to server. Please check your internet connection.',
        'timeout': 'Request timeout. Please try again.',
        '401': 'Invalid email or password.',
        '403': 'Access denied. Please refresh the page.',
        '429': 'Too many attempts. Please wait a moment.'
      };

      let errorMessage = 'Login failed. Please try again.';
      
      for (const [key, msg] of Object.entries(errorMap)) {
        if (error.message?.includes(key) || error.code === key) {
          errorMessage = msg;
          break;
        }
      }

      throw new Error(errorMessage);
    }
  }, [tokenService, userService, scheduleTokenRefresh]);

  // ==================== GOOGLE LOGIN ====================
  const googleLogin = useCallback(() => {
    try {
      console.log('🔗 Redirecting to Google OAuth...');
      const state = crypto.randomUUID();
      sessionStorage.setItem('oauth_state', state);
      const redirectUri = encodeURIComponent(window.location.origin);
      window.location.href = `${apiBaseURL}${API_ENDPOINTS.GOOGLE_AUTH}?state=${state}&redirect=${redirectUri}`;
    } catch (error) {
      console.error('❌ Google login error:', error);
    }
  }, [apiBaseURL]);

  // ==================== COMPLETE GOOGLE PROFILE ====================
  const completeGoogleProfile = useCallback(async (profileData) => {
    try {
      const csrfTokenValue = tokenService.getCSRFToken() || await tokenService.refreshCSRFToken();
      
      const response = await api.post(API_ENDPOINTS.COMPLETE_PROFILE, profileData, {
        headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Profile completion failed');
      }

      const { user: updatedUser, tokens: newTokens } = response.data;

      tokenService.setTokens(newTokens);
      userService.setUser(updatedUser);
      api.setHeader('Authorization', `Bearer ${newTokens.access}`);
      scheduleTokenRefresh(newTokens.access);
      setIsAuthenticated(true);

      return response.data;
    } catch (error) {
      console.error('❌ Complete Google profile error:', error);
      throw error;
    }
  }, [tokenService, userService, scheduleTokenRefresh]);

  // ==================== UPDATE PROFILE ====================
  const updateUserProfile = useCallback(async (profileData) => {
    try {
      const csrfTokenValue = tokenService.getCSRFToken() || await tokenService.refreshCSRFToken();

      const response = await api.put('/auth/profile', profileData, {
        headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Profile update failed');
      }

      const updatedUser = response.data.user;
      userService.updateUser(updatedUser);

      return response.data;
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  }, [tokenService, userService]);

  // ==================== LOGOUT ====================
  const logout = useCallback(async () => {
    try {
      const currentTokens = tokenService.getStoredTokens();
      const csrfTokenValue = tokenService.getCSRFToken();

      if (currentTokens?.refresh) {
        console.log('🚪 Attempting server logout...');
        await api.post(API_ENDPOINTS.LOGOUT, {
          refresh: currentTokens.refresh
        }, {
          headers: csrfTokenValue ? { 'X-CSRF-Token': csrfTokenValue } : {}
        }).catch(err => console.warn('Server logout warning:', err));
      }
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      clearAuth();
      setTimeout(() => {
        window.location.href = `${appBaseURL}/login?session=logged_out`;
      }, 100);
    }
  }, [tokenService, clearAuth, appBaseURL]);

  // ==================== REFRESH USER ====================
  const refreshUser = useCallback(async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const response = await api.get(API_ENDPOINTS.ME);

      if (response?.success) {
        const userData = response.data.user || response.data;
        userService.setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      if (error.response?.status === 401) {
        clearAuth();
      }
      throw error;
    }
  }, [userService, clearAuth]);

  // ==================== CONTEXT VALUE ====================
  const value = useMemo(() => ({
    user,
    authError,
    isAuthenticated,
    loading,
    login,
    googleLogin,
    logout,
    updateUserProfile,
    completeGoogleProfile,
    refreshUser,
    getVerificationEmail: () => sessionStorage.getItem('pending_verification_email') || user?.email,
    clearVerificationEmail: () => sessionStorage.removeItem('pending_verification_email'),
    clearSession: clearAuth,
    requiresVerification: () => {
      const currentUser = userService.getStoredUser();
      return !!(currentUser && !currentUser.isVerified);
    }
  }), [user, authError, isAuthenticated, loading, login, googleLogin, logout,
      updateUserProfile, completeGoogleProfile, refreshUser, clearAuth, userService]);

  // ==================== RENDER ====================
  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-100">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium text-lg">Loading UniMarket...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your experience</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}