import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CommentSection from './CommentSection'; // Import CommentSection

const TicketDetail = () => {
  const { projectId, ticketId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, logout } = useContext(AuthContext); // Include logout

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    console.log('TicketDetail useEffect running');
    console.log('authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'ticketId:', ticketId);

    const fetchTicketDetails = async () => {
      if (!authLoading && isAuthenticated && ticketId) {
        console.log('Attempting to fetch ticket details...');
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found in TicketDetail useEffect');
          setError('No token found');
          setLoading(false);
          return;
        }

        try {
          console.log('Token found, proceeding with API call.');
          const config = {
            headers: {
              'x-auth-token': token,
            },
          };
          // Assuming a backend route like GET /api/tickets/:id exists
          const res = await axios.get(`/api/tickets/${ticketId}`, config);
          console.log('Ticket data fetched successfully:', res.data);
          setTicket(res.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching ticket details:', err);
           if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            // If unauthorized or forbidden, log out the user and redirect to login
            console.log('Auth error (401/403) fetching ticket, logging out.');
            logout();
            navigate('/login');
          } else {
             setError(err.response ? err.response.data.msg : 'Server Error');
             setLoading(false);
          }
        }
      } else if (!authLoading && !isAuthenticated) {
        // Redirect to login if not authenticated after authLoading is false
        console.log('Not authenticated, redirecting to login.');
        navigate('/login');
      }
    };

    fetchTicketDetails();
  }, [isAuthenticated, authLoading, ticketId, navigate, logout]); // Depend on ticketId, auth states, and navigate/logout

  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading ticket details...</div>;
  }

  if (!isAuthenticated) {
    // Redirect handled by useEffect, but this prevents rendering issues
    return null;
  }

  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">Error: {error}</div>;
  }

  if (!ticket) {
    return <div className="container mx-auto mt-8 p-4">Ticket not found.</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4 bg-white rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">Ticket: {ticket.title}</h1>
      <p className="text-gray-700 mb-4"><strong>Description:</strong> {ticket.description || 'No description provided.'}</p>
      <p className="text-gray-700 mb-2"><strong>Priority:</strong> {ticket.priority}</p>
      <p className="text-gray-700 mb-2"><strong>Status:</strong> {ticket.status}</p>
      <p className="text-gray-700 mb-2">
        <strong>Assignee:</strong> {ticket.assignee ? `${ticket.assignee.name} (${ticket.assignee.email})` : 'Unassigned'}
      </p>
      <p className="text-gray-700 mb-4"><strong>Created At:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</p>

      {/* Comment Section */}
      <CommentSection />

      {/* Add buttons for editing, assigning, deleting later */}
      <div className="mt-6">
         <button
          onClick={() => navigate(`/projects/${projectId}/tickets`)}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back to Ticket List
        </button>
         {/* Future Edit Button */}
         {/* <button className="ml-4 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Edit Ticket</button> */}
         {/* Future Assign Button */}
         {/* <button className="ml-4 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Assign Ticket</button> */}
         {/* Future Delete Button */}
         {/* <button className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Delete Ticket</button> */}
      </div>
    </div>
  );
};

export default TicketDetail;
