import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext useEffect is running');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (token) {
      console.log('Token found, setting isAuthenticated to true');
      setIsAuthenticated(true);
    } else {
      console.log('No token found, setting isAuthenticated to false');
      setIsAuthenticated(false);
    }
    console.log('Setting AuthContext loading to false');
    setLoading(false);
  }, []); // Empty dependency array means this runs once on mount

  const login = (token) => {
    console.log('AuthContext login function called with token:', token);
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    console.log('isAuthenticated set to true after login');
  };

  const logout = () => {
    console.log('AuthContext logout function called');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    console.log('isAuthenticated set to false after logout');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
