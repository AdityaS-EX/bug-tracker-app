import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TicketList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!authLoading && isAuthenticated && projectId) {
        try {
          const token = localStorage.getItem('token');
           if (!token) {
                setError('No token found');
                setLoading(false);
                return;
            }
          const config = {
            headers: {
              'x-auth-token': token,
            },
            params: {
              projectId: projectId,
            },
          };
          const res = await axios.get('/api/tickets', config);
          setTickets(res.data);
          setLoading(false);
        } catch (err) {
          console.error(err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            // If unauthorized or forbidden, log out the user and redirect to login
            logout(); // Assuming logout is available from AuthContext
            navigate('/login');
          } else {
            setError(err.response ? err.response.data.msg : 'Server Error');
            setLoading(false);
          }
        }
      } else if (!authLoading && !isAuthenticated) {
           // Redirect to login if not authenticated
            navigate('/login');
      }
    };

    fetchTickets();
  }, [isAuthenticated, authLoading, projectId, navigate]);

  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading tickets...</div>;
  }

   if (!isAuthenticated) {
    // Redirect to login if not authenticated after authLoading is false
    // This case is handled in useEffect, but this prevents rendering issues
    return null;
  }

  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Tickets for Project {projectId}</h1> {/* Potentially display project title */}
      {tickets.length === 0 ? (
        <p>No tickets found for this project.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow-md">
            <thead>
              <tr className="w-full bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Priority</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Assignee</th>
                <th className="py-3 px-6 text-left">Created At</th>
                 <th className="py-3 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{ticket.title}</td>
                  <td className="py-3 px-6 text-left">{ticket.priority}</td>
                  <td className="py-3 px-6 text-left">{ticket.status}</td>
                  <td className="py-3 px-6 text-left">{ticket.assignee ? ticket.assignee.name : 'Unassigned'}</td>
                  <td className="py-3 px-6 text-left">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                   <td className="py-3 px-6 text-left">
                    <button
                        onClick={() => navigate(`/projects/${projectId}/tickets/${ticket._id}`)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs"
                    >
                        View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TicketList;
