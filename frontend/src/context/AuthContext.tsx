import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  login: (token: string, email?: string, firstName?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));
  const [userFirstName, setUserFirstName] = useState<string | null>(localStorage.getItem('userFirstName'));

  useEffect(() => {
    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const login = (newToken: string, email?: string, firstName?: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (email) {
      localStorage.setItem('userEmail', email);
      setUserEmail(email);
    }
    if (firstName) {
      localStorage.setItem('userFirstName', firstName);
      setUserFirstName(firstName);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    setToken(null);
    setUserEmail(null);
    setUserFirstName(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userEmail,
        userFirstName,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
