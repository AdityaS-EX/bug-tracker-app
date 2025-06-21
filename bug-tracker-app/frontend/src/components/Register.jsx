import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Register = () => {
  const { login } = useContext(AuthContext); // Although register doesn't immediately log in, having access to login might be useful later or for consistency.
  const navigate = useNavigate(); // Initialize useNavigate
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [agreeToTerms, setAgreeToTerms] = useState(false); // State for T&C checkbox
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    setAgreeToTerms(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setMessage(''); // Clear previous messages

    // Client-side password validation
    const password = formData.password;
    const passwordErrors = [];
    if (password.length < 8 || password.length > 16) {
      passwordErrors.push('Password must be between 8 and 16 characters.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/g.test(password)) {
      passwordErrors.push('Password must contain at least one unique character.');
    }
    if (!/[0-9]/g.test(password)) {
      passwordErrors.push('Password must contain at least one number.');
    }
    if (!/[a-z]/g.test(password)) {
      passwordErrors.push('Password must contain at least one lowercase character.');
    }
    if (!/[A-Z]/g.test(password)) {
      passwordErrors.push('Password must contain at least one uppercase character.');
    }

    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(' '));
      return;
    }

    // Check if terms and conditions are accepted
    if (!agreeToTerms) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }

    try {
      // Call the backend registration API
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      setMessage('Registration successful! Logging you in and redirecting...');
      // Log the user in immediately after registration if a token is received
      if (res.data && res.data.token) {
        login(res.data.token);
      }
      // Redirect to the dashboard after successful registration
      navigate('/dashboard'); // Redirect to the dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl mb-4 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded"
          required
        />
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
          className="w-full p-2 mb-2 border rounded"
          required
          minLength="8" // Updated minLength
          maxLength="16" // Added maxLength
        />
        {/* Password requirements */}
        <p className="text-sm text-gray-600 mb-4">
          Password must be 8-16 characters and include: unique character, number, lowercase, and uppercase letters.
        </p>
        {/* Terms and Conditions checkbox */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="termsCheckbox"
            checked={agreeToTerms}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          <label htmlFor="termsCheckbox" className="text-sm text-gray-600">
            I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Terms and Conditions</a>
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
