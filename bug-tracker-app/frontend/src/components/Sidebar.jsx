import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-2xl font-bold text-center">Bug Tracker</div>
      <nav className="flex flex-col flex-grow p-4">
        <Link to="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Dashboard
        </Link>
        <Link to="/projects" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Projects
        </Link>
        {/* Add Tickets link later when TicketList is integrated into dashboard layout */}
        {/* <Link to="/tickets" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
          Tickets
        </Link> */}
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