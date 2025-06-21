import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AccountControl = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setNewName(user.name || '');
    }
  }, [user]);

  if (!user) {
    // Optionally redirect to login if user is not loaded
    return <div>Loading user data...</div>;
  }

  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  const handleNameEditSave = async () => {
    try {
      // Placeholder for API call to update name
      // await axios.put(`/api/users/${user._id}`, { name: newName });
      setMessage('Name updated successfully!');
      setError('');
      setEditingName(false);
      // In a real app, you would likely want to update the user context here
      // For now, we'll just show a success message
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update name.');
      setMessage('');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // API call to delete account
        await axios.delete('/api/auth/user');
        setMessage('Account deleted successfully.'); // Optional success message before redirect
        setError(''); // Clear any previous errors
        logout(); // Log out the user after deletion
        navigate('/register'); // Redirect to register or login page
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete account.');
        setMessage('');
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Account Control</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {message && <p className="text-green-500 mb-4">{message}</p>}

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Account Information</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Edit Name</h2>
        {editingName ? (
          <div>
            <input
              type="text"
              value={newName}
              onChange={handleNameChange}
              className="p-2 border rounded mr-2"
            />
            <button
              onClick={handleNameEditSave}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2"
            >
              Save
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <button
              onClick={() => setEditingName(true)}
              className="mt-2 bg-gray-300 text-gray-800 p-2 rounded hover:bg-gray-400"
            >
              Edit Name
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-2">Delete Account</h2>
        <p className="mb-4">This action is irreversible. Deleting your account will remove all your data.</p>
        <button
          onClick={handleDeleteAccount}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default AccountControl;
