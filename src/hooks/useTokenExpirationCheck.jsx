import { useContext, useEffect } from 'react';
import { AuthContext } from '../auth/AuthContextBase';

const useTokenExpirationCheck = () => {
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    if (window.location.pathname === '/signin') {
      return;
    }

    const checkTokenExpiration = () => {
      if (window.location.pathname === '/signin') return;
      const expiration = localStorage.getItem('expires_at');
      const expiracionTiempo = new Date(expiration).getTime();
      const now = new Date().getTime();

      if (expiration && expiracionTiempo < now) {
        logout();
      }
    };

    checkTokenExpiration();

    const intervalId = setInterval(checkTokenExpiration, 60 * 1000);

    const handleStorage = (event) => {
      if (event.key === 'token' && event.newValue === null) {
        window.location.href = "/signin";
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
    };
  }, [token, logout]);
};

export default useTokenExpirationCheck;
