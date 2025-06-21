import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditTicketModal = ({ show, onClose, ticket, onUpdate, teamMembers }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    status: '',
    assignee: '', // Stores the selected assignee ID from the dropdown
  });
  // Store the initial assignee ID to compare against for changes
  const [initialAssigneeId, setInitialAssigneeId] = useState('');

  useEffect(() => {
    if (ticket) {
      const currentAssigneeId = ticket.assignee ? ticket.assignee._id : '';
      setFormData({
        title: ticket.title || '',
        description: ticket.description || '',
        priority: ticket.priority || '',
        status: ticket.status || '',
        assignee: currentAssigneeId,
      });
      setInitialAssigneeId(currentAssigneeId);
    } else {
      // Reset form if no ticket is provided (e.g., modal closed and reopened without a ticket)
      setFormData({ title: '', description: '', priority: '', status: '', assignee: '' });
      setInitialAssigneeId('');
    }
  }, [ticket]); // Depend on the ticket prop

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      // Prepare data for the main ticket update (excluding assignee)
      const ticketDetailsToUpdate = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
      };

      // Update main ticket details first
      let updatedTicket = await axios.put(
        `/api/tickets/${ticket._id}`,
        ticketDetailsToUpdate,
        config
      );

      // Check if assignee has changed
      const newAssigneeId = formData.assignee === '' ? null : formData.assignee;
      const originalAssigneeIdForCompare = initialAssigneeId === '' ? null : initialAssigneeId;

      if (newAssigneeId !== originalAssigneeIdForCompare) {
        // Assignee has changed, make a call to the /assign route
        const assignResponse = await axios.put(
          `/api/tickets/${ticket._id}/assign`,
          { userId: newAssigneeId }, // Send userId as null if unassigned
          config
        );
        updatedTicket = assignResponse; // The /assign route should return the updated ticket
      }

      onUpdate(updatedTicket.data); // Call the onUpdate function passed from parent
      onClose(); // Close the modal on success
    } catch (err) {
      console.error('Error updating ticket:', err.response ? err.response.data : err);
      // Handle error (e.g., show a message to the user)
      alert('Failed to update ticket: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  if (!show || !ticket) { // Ensure ticket is present before rendering form
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Edit Ticket</h3>
          <div className="mt-2 px-7 py-3">
            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={onChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={onChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

               <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assignee">
                  Assignee
                </label>
                <select
                  id="assignee"
                  name="assignee"
                  value={formData.assignee} // This should be the ID of the assigned user or ''
                  onChange={onChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                   <option value="">Unassigned</option>
                   {Array.isArray(teamMembers) && teamMembers.map(member => (
                     <option key={member._id} value={member._id}>{member.name}</option>
                   ))}
                </select>
              </div>

              <div className="items-center px-4 py-3 text-right">
                <button
                  id="cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="mr-3 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  id="ok-btn"
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTicketModal;
