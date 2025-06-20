import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CommentSection from './CommentSection'; // Import CommentSection
import EditTicketModal from './EditTicketModal'; // Import EditTicketModal

const TicketDetail = () => {
  const { projectId, ticketId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, logout, user } = useContext(AuthContext); // Include user

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false); // State for modal visibility
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete confirmation
  const [projectTeamMembers, setProjectTeamMembers] = useState([]); // State to store project team members for modal


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
              'Authorization': `Bearer ${token}`, // Use Bearer token
            },
          };
          // Assuming a backend route like GET /api/tickets/:id exists
          const res = await axios.get(`/api/tickets/${ticketId}`, config);
          console.log('Ticket data fetched successfully:', res.data);
          setTicket(res.data);
          setLoading(false);

           // Fetch project team members for the edit modal
          const projectRes = await axios.get(`/api/projects/${projectId}`, config);
          setProjectTeamMembers(projectRes.data.teamMembers);

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
  }, [isAuthenticated, authLoading, ticketId, projectId, navigate, logout]); // Add projectId to dependencies

  // Handle ticket update from modal
  const handleTicketUpdate = (updatedTicket) => {
    setTicket(updatedTicket);
  };

  // Handle ticket deletion
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };
      await axios.delete(`/api/tickets/${ticketId}`, config);
      // Redirect to ticket list after successful deletion
      navigate(`/projects/${projectId}/tickets`);
    } catch (err) {
      console.error(err);
      // Handle error (e.g., show a message)
       setError(err.response ? err.response.data.msg : 'Server Error');
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const proceedDelete = () => {
    handleDelete();
    setShowDeleteConfirm(false);
  };

  // Basic role-based access check for delete button (assuming user object has a role property)
  const canDeleteTicket = user && user.role === 'Admin'; // Only admin can delete


  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading ticket details...</div>;
  }

  if (!isAuthenticated) {
    // Redirect handled by useEffect, but this prevents rendering issues
    return null;
  }

  if (error) {
    return (
        <div className="container mx-auto mt-8 p-4 text-red-700">
            Error: {error}
             <div className="mt-6">
                <button
                    onClick={() => navigate(`/projects/${projectId}/tickets`)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Back to Ticket List
                </button>
            </div>
        </div>
    );
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
      {/* Pass ticketId to CommentSection */}
      <CommentSection ticketId={ticket._id} />

      <div className="mt-6">
         <button
          onClick={() => navigate(`/projects/${projectId}/tickets`)}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back to Ticket List
        </button>

         {/* Edit Button */}
         <button
            onClick={() => setShowEditModal(true)}
            className="ml-4 bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
         >
            Edit Ticket
         </button>

         {/* Delete Button (only visible if canDeleteTicket is true) */}
         {canDeleteTicket && (
           <button
              onClick={confirmDelete}
              className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
           >
              Delete Ticket
           </button>
         )}

      </div>

       {/* Edit Ticket Modal */}
       {ticket && (
         <EditTicketModal
            show={showEditModal}
            onClose={() => setShowEditModal(false)}
            ticket={ticket}
            onUpdate={handleTicketUpdate}
            teamMembers={projectTeamMembers} // Pass project team members to the modal
         />
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="delete-modal">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
               <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
                  <div className="mt-2 px-7 py-3">
                     <p className="text-sm text-gray-500">
                        Are you sure you want to delete this ticket? This action cannot be undone.
                     </p>
                  </div>
                  <div className="items-center px-4 py-3">
                     <button
                        id="confirm-delete-btn"
                        onClick={proceedDelete}
                        className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 sm:ml-3 sm:w-auto"
                     >
                        Delete
                     </button>
                     <button
                        id="cancel-delete-btn"
                        onClick={cancelDelete}
                        className="ml-3 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 sm:mt-0 sm:w-auto"
                     >
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default TicketDetail;
