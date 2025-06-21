import React, { useState, useContext, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  // Consume logoutMessage and clearLogoutMessage from AuthContext
  const { login, logoutMessage, clearLogoutMessage } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize useNavigate
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    // Clear the logout message when the component unmounts or if the user navigates away
    // This ensures the message is shown once per logout event.
    return () => {
      if (logoutMessage) { // Only clear if there was a message
        clearLogoutMessage();
      }
    };
  }, [logoutMessage, clearLogoutMessage]); // Depend on logoutMessage to re-run if it changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use relative URL, axios.defaults.baseURL will be prepended
      const res = await axios.post('/api/auth/login', formData);
      login(res.data.token);
      setError(''); // Clear error on successful login
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl mb-4 text-center">Login</h2>
        {/* Display logout message if present */}
        {logoutMessage && (
          <p className="text-blue-500 mb-4 text-center bg-blue-100 border border-blue-300 p-3 rounded">
            {logoutMessage}
          </p>
        )}
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 mb-6 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
