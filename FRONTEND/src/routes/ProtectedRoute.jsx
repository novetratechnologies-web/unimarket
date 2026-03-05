import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ 
  children, 
  requireVerification = true,
  fallbackPath = "/login",
  customLoadingComponent,
  customUnauthorizedComponent 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);

  // Show loader for minimum time to prevent flash
  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Custom loading component
  if (loading || showLoader) {
    if (customLoadingComponent) {
      return customLoadingComponent;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-100">
        <div className="text-center space-y-4">
          {/* Animated Logo */}
          <div className="flex justify-center">
            <div className="bg-teal-100 p-4 rounded-2xl shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          
          {/* Loading Text */}
          <div className="space-y-2">
            <p className="text-gray-700 font-semibold text-lg">Securing your session</p>
            <p className="text-gray-500 text-sm">Just a moment...</p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-600 to-cyan-600 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (customUnauthorizedComponent) {
      return customUnauthorizedComponent;
    }

    return (
      <Navigate 
        to={fallbackPath} 
        replace 
        state={{ 
          from: location,
          message: "Authentication required",
          type: "error"
        }} 
      />
    );
  }

  // Email verification required but not verified
  if (requireVerification && !user.isVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        replace 
        state={{ 
          from: location,
          email: user.email,
          message: "Email verification required",
          description: "Please verify your email address to access this content",
          type: "warning"
        }} 
      />
    );
  }

  // Render protected content
  return children;
};

// Optional: Higher-order component version
export const withProtection = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

export default ProtectedRoute;