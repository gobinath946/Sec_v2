import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const sessionAuth = sessionStorage.getItem('auth');
    return sessionAuth ? JSON.parse(sessionAuth) : false;
  });

  const setAuthentication = (value) => {
    setIsAuthenticated(value);
  };

  useEffect(() => {
    sessionStorage.setItem('auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthentication }}>
      {children}
    </AuthContext.Provider>
  );
};
