import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated, authLoading } = useContext(AuthContext);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!authLoading && isAuthenticated && user && user.role === 'Admin') {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          };
          const res = await axios.get('/api/users', config);
          setUsers(res.data);
          setLoading(false);
        } catch (err) {
          console.error(err);
          setError(err.response ? err.response.data.msg : 'Server Error');
          setLoading(false);
        }
      } else if (!authLoading && (!isAuthenticated || (user && user.role !== 'Admin'))) {
        // Not authenticated or not an admin, prevent loading and show error/message
        setLoading(false);
        setError('You are not authorized to view this page.');
      }
    };

    fetchUsers();
  }, [isAuthenticated, authLoading, user]); // Depend on auth state and user

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      // Call the backend API to update the user's role
      const res = await axios.put(`/api/users/${userId}/role`, { role: newRole }, config);
      
      // Update the users state with the updated user
      setUsers(users.map(user => user._id === userId ? res.data : user));

    } catch (err) {
      console.error(err);
      // Handle error (e.g., show a message)
      setError(err.response ? err.response.data.msg : 'Error updating role.');
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading users...</div>;
  }

   // If not authenticated or not admin, show error message
  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">{error}</div>;
  }

  // Only render the management table if the user is an admin
  if (user && user.role === 'Admin') {
    return (
      <div className="container mx-auto mt-8 p-4">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow-md">
            <thead>
              <tr className="w-full bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Role</th>
                <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{u.name}</td>
                  <td className="py-3 px-6 text-left">{u.email}</td>
                  <td className="py-3 px-6 text-left">{u.role}</td>
                  <td className="py-3 px-6 text-left">
                     {/* Role change dropdown for admins */}
                     {u._id !== user._id ? ( // Prevent admin from changing their own role here
                        <select
                           value={u.role}
                           onChange={(e) => handleRoleChange(u._id, e.target.value)}
                           className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                           <option value="Admin">Admin</option>
                           <option value="Developer">Developer</option>
                           <option value="Submitter">Submitter</option>
                        </select>
                     ) : (
                        <span>Admin (Your Role)</span> // Indicate it's the logged-in admin's role
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback for non-admins (should be caught by the error state above)
  return null;
};

export default UserManagement;
