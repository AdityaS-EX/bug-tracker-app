import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TicketFilters from './TicketFilters'; // Import TicketFilters component

const TicketList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, logout } = useContext(AuthContext); // Destructure logout

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]); // State to store project team members

  // Function to fetch tickets (used by TicketFilters)
  const fetchTickets = async (filters = {}) => {
    if (!authLoading && isAuthenticated && projectId) {
      setLoading(true); // Set loading to true before fetching
      try {
        const token = localStorage.getItem('token');
         if (!token) {
              setError('No token found');
              setLoading(false);
              return;
          }
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`, // Use Bearer token
          },
          params: {
            projectId: projectId,
            ...filters, // Spread the filters object here
          },
        };
        const res = await axios.get('/api/tickets', config);
        setTickets(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
          navigate('/login');
        } else {
          setError(err.response ? err.response.data.msg : 'Server Error');
        }
         setLoading(false); // Set loading to false on error
      }
    }
  };

  // Fetch project details to get team members and initial tickets
  useEffect(() => {
    const fetchData = async () => {
      if (!authLoading && isAuthenticated && projectId) {
        setLoading(true); // Set loading to true before fetching
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          };
          // Fetch project details
          const projectRes = await axios.get(`/api/projects/${projectId}`, config);
          setTeamMembers(projectRes.data.teamMembers); // Assuming project data includes teamMembers

          // Fetch initial tickets
          await fetchTickets();

        } catch (err) {
          console.error(err);
           if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            logout();
            navigate('/login');
          } else {
            setError(err.response ? err.response.data.msg : 'Server Error');
          }
           setLoading(false); // Set loading to false on error
        }
      } else if (!authLoading && !isAuthenticated) {
         navigate('/login');
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading, projectId, navigate]); // Depend on auth state, project ID, and navigate


  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading tickets...</div>;
  }

   if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Tickets for Project {projectId}</h1> {/* Potentially display project title */}

      {/* Render TicketFilters component */}
      <TicketFilters
        projectId={projectId}
        setTickets={setTickets}
        teamMembers={teamMembers}
        fetchTickets={fetchTickets} // Pass the fetchTickets function to the filters component
      />

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
