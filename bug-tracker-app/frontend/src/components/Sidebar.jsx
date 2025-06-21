import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext); // Get user from AuthContext
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if the logged-in user is an admin
  const isAdmin = user && user.role === 'Admin';

  return (
    <div className="w-48 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold text-center">Bug Tracker</div>
      <nav className="flex flex-col flex-grow p-4">
        <Link to="/dashboard" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Dashboard
        </Link>
        <Link to="/dashboard/projects" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Projects
        </Link>
        {/* Account Control Link */}
        <Link to="/dashboard/account" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Account Control
        </Link>
        {/* Add Tickets link later when TicketList is integrated into dashboard layout */}
        {/* <Link to="/tickets" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Tickets
        </Link> */}

        {/* User Management Link (Admin only) */}
        {isAdmin && (
          <Link to="/dashboard/users" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700 mt-2">
            User Management
          </Link>
        )}
      </nav>
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="block w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
