// ============================================
// context/AuthContext.jsx - FIXED
// ============================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs to prevent infinite loops
  const initDoneRef = useRef(false);
  const verificationInProgressRef = useRef(false);
  const lastVerificationTimeRef = useRef(0);

  // ============================================
  // INITIALIZE AUTH - Check for stored user (RUNS ONCE)
  // ============================================
  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initDoneRef.current) return;
    
    const initAuth = async () => {
      console.log('🔍 Auth initializing...');
      
      try {
        // Check if we have stored user data
        const storedUser = api.token.getUser();
        const token = api.token.getAccessToken();
        
        console.log('🔍 Stored data:', { 
          hasUser: !!storedUser, 
          hasToken: !!token,
          userEmail: storedUser?.email
        });
        
        if (storedUser && token) {
          // Set user immediately for faster UI
          setUser(storedUser);
          console.log('👤 Restored user from storage:', storedUser.email);
          
          // Verify token in background with debounce
          setTimeout(() => {
            verifyTokenInBackground();
          }, 1000);
        } else {
          console.log('👤 No stored user found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
        setIsInitialized(true);
        initDoneRef.current = true;
        console.log('✅ Auth initialized');
      }
    };

    initAuth();

    // Listen for auth expired events
    const handleAuthExpired = () => {
      console.log('🔒 Auth expired event received');
      setUser(null);
      api.clearAuth();
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []); // Empty deps - runs once on mount

  // ============================================
  // VERIFY TOKEN IN BACKGROUND (WITH RATE LIMITING)
  // ============================================
  const verifyTokenInBackground = useCallback(async () => {
    // Prevent concurrent verifications
    if (verificationInProgressRef.current) return;
    
    // Rate limit: don't verify more than once every 5 minutes
    const now = Date.now();
    if (now - lastVerificationTimeRef.current < 5 * 60 * 1000) {
      console.log('⏱️ Token verification skipped - too soon');
      return;
    }
    
    verificationInProgressRef.current = true;
    
    try {
      console.log('🔍 Verifying token in background...');
      const response = await api.auth.me();
      console.log('🔍 Token verification response:', response);
      
      if (response?.data) {
        setUser(response.data);
        api.token.setUser(response.data);
        lastVerificationTimeRef.current = now;
        console.log('✅ Token validated, user updated:', response.data.email);
      } else {
        console.log('⚠️ Token verification returned no data');
      }
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      
      // Only clear on definite auth errors
      if (error.response?.status === 401) {
        console.log('🔒 Token expired, clearing auth');
        api.clearAuth();
        setUser(null);
      }
    } finally {
      verificationInProgressRef.current = false;
    }
  }, []);

  // ============================================
  // CHECK AUTHENTICATION STATUS (SYNCHRONOUS - NO API CALL)
  // ============================================
  const checkAuth = useCallback(() => {
    const hasUser = !!user;
    const hasToken = !!api.token.getAccessToken();
    const isAuth = hasUser && hasToken;
    
    console.log('🔍 checkAuth:', { hasUser, hasToken, isAuth });
    return isAuth;
  }, [user]);

  // ============================================
  // LOGIN - FIXED for your API response structure
  // ============================================
const login = async (credentials) => {
  try {
    setError(null);
    setLoading(true);
    
    console.log('🔐 Login attempt for:', credentials.email);
    const response = await api.auth.login(credentials);
    console.log('📥 Raw API response:', response);
    
    if (response?.success) {
      const responseData = response.data;
      console.log('📦 Response data structure:', {
        hasUser: !!responseData?.user,
        hasAccessToken: !!responseData?.accessToken,
        userRole: responseData?.user?.role,
        fullData: responseData
      });
      
      // Your backend returns: { user, accessToken, refreshToken, sessionToken, expiresIn }
      const { user, accessToken, refreshToken } = responseData || {};
      
      if (!accessToken || !user) {
        console.error('❌ Missing required fields:', { 
          hasAccessToken: !!accessToken, 
          hasUser: !!user 
        });
        throw new Error('Invalid response from server');
      }
      
      console.log('✅ Login successful for:', user.email);
      console.log('📍 Storing tokens...');
      
      // Store tokens
      api.token.setTokens(accessToken, refreshToken);
      api.token.setUser(user);
      setUser(user);
      lastVerificationTimeRef.current = Date.now();
      
      // Verify storage worked
      const storedToken = api.token.getAccessToken();
      console.log('📍 Token stored successfully:', !!storedToken);
      
      return {
        success: true,
        data: user,
        message: 'Login successful'
      };
    }
    
    console.error('❌ Login failed:', response?.message);
    return {
      success: false,
      error: response?.message || 'Login failed',
      errors: response?.errors
    };
    
  } catch (error) {
    console.error('❌ Login error:', error);
    const errorMessage = error?.message || 'Login failed';
    setError(errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      errors: error?.errors
    };
  } finally {
    setLoading(false);
  }
};

  // ============================================
  // LOGOUT
  // ============================================
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚪 Logging out...');
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      api.clearAuth();
      setUser(null);
      setError(null);
      setLoading(false);
      
      // Reset refs
      lastVerificationTimeRef.current = 0;
      
      // Clear dashboard store
      try {
        const { useDashboardStore } = await import('../pages/stores/dashboardStore');
        useDashboardStore.getState().resetToDefaults();
      } catch (e) {
        console.error('Failed to reset dashboard store:', e);
      }
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('auth:logout'));
      console.log('✅ Logout complete');
    }
  }, []);

  // ============================================
  // REFRESH USER DATA (WITH RATE LIMITING)
  // ============================================
  const refreshUser = useCallback(async () => {
    // Prevent concurrent refreshes
    if (verificationInProgressRef.current) {
      console.log('⏱️ User refresh skipped - already in progress');
      return { success: false, error: 'Refresh in progress' };
    }
    
    // Rate limit: don't refresh more than once every 30 seconds
    const now = Date.now();
    if (now - lastVerificationTimeRef.current < 30000) {
      console.log('⏱️ User refresh skipped - rate limited');
      return { success: false, error: 'Rate limited' };
    }
    
    verificationInProgressRef.current = true;
    
    try {
      console.log('🔄 Refreshing user data...');
      const response = await api.auth.me();
      
      if (response?.data) {
        setUser(response.data);
        api.token.setUser(response.data);
        lastVerificationTimeRef.current = now;
        console.log('✅ User refreshed:', response.data.email);
        return { success: true, data: response.data };
      }
      
      return response;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return { success: false, error: error?.message };
    } finally {
      verificationInProgressRef.current = false;
    }
  }, []);

  // ============================================
  // PERMISSION HELPERS
  // ============================================
  const hasPermission = useCallback((permission) => {
    if (!permission) return false;
    return user?.permissions?.includes(permission) || user?.role === 'super_admin';
  }, [user]);

  const hasAnyPermission = useCallback((permissions) => {
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) return false;
    if (user?.role === 'super_admin') return true;
    return permissions.some(p => user?.permissions?.includes(p));
  }, [user]);

  const hasAllPermissions = useCallback((permissions) => {
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) return false;
    if (user?.role === 'super_admin') return true;
    return permissions.every(p => user?.permissions?.includes(p));
  }, [user]);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    return user?.role === 'super_admin';
  }, [user]);

  const isVendor = useCallback(() => {
    return user?.role === 'vendor';
  }, [user]);

  const isCustomer = useCallback(() => {
    return user?.role === 'customer';
  }, [user]);

  // ============================================
  // UPDATE PROFILE
  // ============================================
  const updateProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.auth.updateProfile(profileData);
      
      if (response?.success && response.data) {
        setUser(response.data);
        api.token.setUser(response.data);
        
        return {
          success: true,
          data: response.data,
          message: 'Profile updated successfully'
        };
      }
      
      return response;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // PASSWORD METHODS
  // ============================================
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await api.auth.changePassword(currentPassword, newPassword);
      
      if (response?.success) {
        return { success: true, message: 'Password changed successfully' };
      }
      
      return response;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to change password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      setError(null);
      const response = await api.auth.forgotPassword(email);
      
      if (response?.success) {
        return { success: true, message: 'Password reset email sent' };
      }
      
      return response;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to send reset email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    try {
      setError(null);
      const response = await api.auth.resetPassword(token, password);
      
      if (response?.success) {
        return { success: true, message: 'Password reset successful' };
      }
      
      return response;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to reset password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // ============================================
  // EMAIL METHODS
  // ============================================
  const verifyEmail = useCallback(async (token) => {
    try {
      setError(null);
      const response = await api.auth.verifyEmail(token);
      
      if (response?.success) {
        await refreshUser();
        return { success: true, message: 'Email verified successfully' };
      }
      
      return response;
    } catch (error) {
      const errorMessage = error?.message || 'Failed to verify email';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [refreshUser]);

  // ============================================
  // FORCE VERIFICATION (for manual refresh)
  // ============================================
  const forceVerify = useCallback(async () => {
    lastVerificationTimeRef.current = 0; // Reset rate limit
    return refreshUser();
  }, [refreshUser]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    // State
    user,
    loading,
    error,
    isInitialized,
    
    // Auth status (boolean for quick access)
    isAuthenticated: !!user,
    
    // Auth methods (functions)
    checkAuth,
    login,
    logout,
    refreshUser,
    forceVerify,
    
    // Permission helpers (functions)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    isVendor,
    isCustomer,
    
    // User methods
    updateProfile,
    
    // Password methods
    changePassword,
    forgotPassword,
    resetPassword,
    
    // Email methods
    verifyEmail,
    
    // Token management (expose for advanced use)
    tokenManager: api.token
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;