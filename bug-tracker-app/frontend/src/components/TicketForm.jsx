import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TicketForm = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, logout } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    assignee: '', // Reverted to single assignee, initialized as an empty string
    projectId: projectId,
  });
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Destructure single assignee
  const { title, description, priority, assignee } = formData; 

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!authLoading && isAuthenticated && projectId) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
              setError('No token found');
              return;
          }
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          };
          const res = await axios.get(`/api/projects/${projectId}`, config);
          setProjectMembers(res.data.teamMembers);
        } catch (err) {
          console.error('Failed to fetch project members:', err);
        }
      }
    };
    fetchProjectMembers();
  }, [isAuthenticated, authLoading, projectId]);

  // Simplified onChange for single select and other inputs
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!authLoading && !isAuthenticated) {
        navigate('/login');
        return;
    }

    try {
      const token = localStorage.getItem('token');
       if (!token) {
            setError('No token found');
            setLoading(false);
            return;
        }
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };
      
      // Prepare data for single assignee
      const dataToSend = { 
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        projectId: formData.projectId,
        // Send assignee only if it's not an empty string, backend handles null conversion
        assignee: formData.assignee ? formData.assignee : null 
      }; 

      await axios.post('/api/tickets', dataToSend, config);
      setLoading(false);
      navigate(`/dashboard/projects/${projectId}/tickets`);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        if (logout) logout('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Server Error creating ticket.');
        setLoading(false);
      }
    }
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

   if (!isAuthenticated) {
    navigate('/login');
    return null; 
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(`/dashboard/projects/${projectId}`)}
          className="mr-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
           <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 010 1.06L9.56 10l3.23 3.71a.75.75 0 11-1.06 1.06l-3.75-4.3a.75.75 0 010-1.08l3.75-4.3a.75.75 0 011.06 0z" clipRule="evenodd" />
          </svg>
          Back to Project
        </button>
        <h1 className="text-2xl font-bold">Create New Ticket</h1>
      </div>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
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
            value={description}
            onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="4"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
         <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assignee">
            Assignee
          </label>
          <select
            id="assignee" // Reverted id
            name="assignee" // Reverted name
            value={assignee} // Bind to single assignee string
            onChange={onChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select Assignee (Optional)</option> 
            {projectMembers.map((member) => (
                <option key={member._id} value={member._id}>
                    {member.name} ({member.email})
                </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;
