import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [logoutMessage, setLogoutMessage] = useState(''); // State for logout messages

  // Load user from backend using token
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('loadUser: No token found in localStorage. Setting isAuthenticated to false, user to null, loading to false.');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log('loadUser: Token found. Attempting to fetch user data from /api/auth/user...');
      // Axios interceptor in index.js should handle adding the token to headers
      const res = await axios.get('/api/auth/user');
      console.log('loadUser: User data fetched successfully:', res.data);
      setIsAuthenticated(true);
      setUser(res.data);
    } catch (err) {
      console.error('loadUser: Error fetching user data:', err);
      // Clear token and auth state if fetching user fails (e.g., invalid token)
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
        // Set loading to false after fetch attempt (success or failure)
        console.log('loadUser: Setting loading to false.');
        setLoading(false);
    }
  };

  // Effect to load user on initial mount and set up axios response interceptor
  useEffect(() => {
    console.log('AuthContext useEffect is running (initial mount). Calling loadUser().');
    loadUser();

    // Axios response interceptor for handling 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response, // Pass through successful responses
      (error) => {
        if (error.response && error.response.status === 401) {
          // Don't show error for the /api/auth/user check if it fails initially
          // as this is part of the normal auth flow check.
          if (error.config.url !== '/api/auth/user') {
            logout('Your session has expired. Please log in again.');
          } else {
            // For the initial /api/auth/user check, just let it fail silently on the UI
            // logout() without a message will be handled if token is invalid by loadUser itself
            // or if user explicitly logs out.
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when the component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };

  }, []); // Empty dependency array means this runs once on mount

  // Effect to load user when isAuthenticated or user changes
  // This helps ensure user data is fetched immediately after a successful login
  useEffect(() => {
    console.log('AuthContext useEffect: isAuthenticated or user changed. isAuthenticated:', isAuthenticated, 'user:', user);
    if (isAuthenticated) {
        // If authenticated becomes true, ensure user data is loaded
        if (!user) { // Only load if user data isn't already present
             console.log('AuthContext useEffect: Authenticated but user is null. Calling loadUser().');
             loadUser();
        } else {
             console.log('AuthContext useEffect: Authenticated and user data present. Setting loading to false.');
             setLoading(false); // If authenticated and user data is already here, stop loading
        }
    } else {
        // If authenticated becomes false, clear user and stop loading
        console.log('AuthContext useEffect: Not authenticated. Clearing user and setting loading to false.');
        setUser(null);
        setLoading(false);
    }
  }, [isAuthenticated, user]); // Dependency array includes isAuthenticated and user

  const login = (token) => {
    console.log('AuthContext login function called with token:', token);
    localStorage.setItem('token', token);
    // Set isAuthenticated to true immediately; the useEffect will handle loading user data
    setIsAuthenticated(true);
    console.log('isAuthenticated set to true after login. useEffect should load user data.');
    // No need to call loadUser() directly here, the useEffect will trigger
  };

  // Keep only this logout function that handles the message
  const logout = (message) => { // Accept an optional message
    console.log('AuthContext logout function called');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null); // Clear user state on logout
    setLogoutMessage(message || 'You have been successfully logged out.'); // Set logout message
    console.log('isAuthenticated set to false and user is null after logout. useEffect will handle loading state.');
  };

  const clearLogoutMessage = () => {
    setLogoutMessage('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout, logoutMessage, clearLogoutMessage }}>
      {children}
    </AuthContext.Provider>
  );
};
