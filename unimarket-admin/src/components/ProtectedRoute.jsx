// admin/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSkeleton';

const ProtectedRoute = ({ 
  children, 
  requiredRole,
  requiredPermissions = [],
  redirectTo = '/login',
  fallbackPath = '/unauthorized',
  bypassForSuperAdmin = true // New option to always allow super_admin
}) => {
  const { user, loading, checkAuth, refreshUser, isAuthenticated: isAuthBool } = useAuth();
  const location = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      setVerifying(true);
      
      try {
        // Check if user is authenticated using checkAuth() function
        if (!checkAuth()) {
          console.log('🔒 Not authenticated, redirecting to login');
          setAuthorized(false);
          setVerifying(false);
          return;
        }

        // If we have user data but it might be stale, refresh it
        if (user) {
          try {
            await refreshUser(); // This calls /api/admin/auth/me
          } catch (error) {
            console.error('Failed to refresh user data:', error);
            // Continue with existing user data
          }
        }

        // SUPER ADMIN BYPASS - If user is super_admin and bypass is enabled, grant access immediately
        if (bypassForSuperAdmin && user?.role === 'super_admin') {
          console.log('🔓 Super admin access granted (bypass)');
          setAuthorized(true);
          setVerifying(false);
          return;
        }

        // Check role requirements
        if (requiredRole) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!user?.role || !roles.includes(user.role)) {
            console.log('🔒 Role mismatch:', { required: roles, actual: user?.role });
            setAuthorized(false);
            setVerifying(false);
            return;
          }
        }

        // Check permissions
        if (requiredPermissions.length > 0) {
          const userPermissions = user?.permissions || [];
          
          // SUPER ADMIN OVERRIDE - If user is super_admin, grant all permissions
          if (user?.role === 'super_admin') {
            console.log('🔓 Super admin granted all permissions');
            setAuthorized(true);
            setVerifying(false);
            return;
          }

          const hasPermission = requiredPermissions.some(permission => 
            userPermissions.includes(permission) || userPermissions.includes('*') // Allow wildcard
          );
          
          if (!hasPermission) {
            console.log('🔒 Permission denied:', { required: requiredPermissions, actual: userPermissions });
            setAuthorized(false);
            setVerifying(false);
            return;
          }
        }

        // All checks passed
        setAuthorized(true);
      } catch (error) {
        console.error('Protected route verification error:', error);
        setAuthorized(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyAccess();
  }, [checkAuth, user, requiredRole, requiredPermissions, refreshUser, bypassForSuperAdmin]);

  // Show loading spinner while verifying
  if (loading || verifying) {
    return <LoadingSpinner fullScreen message="Verifying access..." />;
  }

  // Redirect to login if not authenticated (using checkAuth or isAuthBool)
  if (!checkAuth() || !isAuthBool) {
    console.log('🔒 Not authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Redirect to unauthorized if not authorized
  if (!authorized) {
    console.log('🔒 Not authorized, redirecting to:', fallbackPath);
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // All good, render children
  return children;
};

// ============================================
// ADMIN-SPECIFIC PROTECTED ROUTE
// ============================================
export const AdminProtectedRoute = ({ 
  children, 
  requiredPermissions = [],
  bypassForSuperAdmin = true, // Enable super_admin bypass by default
  ...props 
}) => {
  return (
    <ProtectedRoute
      requiredRole={['super_admin', 'admin']}
      requiredPermissions={requiredPermissions}
      redirectTo="/login"
      fallbackPath="/unauthorized"
      bypassForSuperAdmin={bypassForSuperAdmin}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// ============================================
// SUPER ADMIN ONLY PROTECTED ROUTE
// ============================================
export const SuperAdminProtectedRoute = ({ 
  children, 
  requiredPermissions = [],
  bypassForSuperAdmin = true, // This is redundant but kept for consistency
  ...props 
}) => {
  return (
    <ProtectedRoute
      requiredRole="super_admin"
      requiredPermissions={requiredPermissions}
      redirectTo="/login"
      fallbackPath="/unauthorized"
      bypassForSuperAdmin={bypassForSuperAdmin}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// ============================================
// VENDOR PROTECTED ROUTE
// ============================================
export const VendorProtectedRoute = ({ 
  children, 
  requiredPermissions = [],
  bypassForSuperAdmin = true, // Super admin can also access vendor routes if needed
  ...props 
}) => {
  return (
    <ProtectedRoute
      requiredRole={['vendor', 'super_admin', 'admin']} // Allow super_admin and admin to access vendor routes
      requiredPermissions={requiredPermissions}
      redirectTo="/vendor/login"
      fallbackPath="/vendor/unauthorized"
      bypassForSuperAdmin={bypassForSuperAdmin}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
};

// ============================================
// PERMISSION CHECK HELPER
// ============================================
export const hasPermission = (user, requiredPermissions) => {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === 'super_admin') return true;
  
  const userPermissions = user.permissions || [];
  
  // Check if user has wildcard permission
  if (userPermissions.includes('*')) return true;
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};

// ============================================
// ROLE CHECK HELPER
// ============================================
export const hasRole = (user, requiredRoles) => {
  if (!user) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
};

export default ProtectedRoute;