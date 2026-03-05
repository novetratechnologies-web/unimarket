import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthNavigationHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle logout events
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };

    // Handle auth expired events
    const handleAuthExpired = () => {
      navigate('/login?session=expired', { replace: true });
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default AuthNavigationHandler;