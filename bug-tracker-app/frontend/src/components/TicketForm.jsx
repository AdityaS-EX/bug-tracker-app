import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TicketForm = () => {
  const { projectId } = useParams(); // Assuming projectId is passed in the URL
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    assignee: '',
    projectId: projectId, // Include projectId in form data
  });
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { title, description, priority, assignee } = formData;

  useEffect(() => {
    // Fetch project members to populate assignee dropdown
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
              'x-auth-token': token,
            },
          };
          const res = await axios.get(`/api/projects/${projectId}`, config);
          setProjectMembers(res.data.teamMembers);
        } catch (err) {
          console.error(err);
          // setError('Failed to fetch project members');
        }
      }
    };
    fetchProjectMembers();
  }, [isAuthenticated, authLoading, projectId]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!authLoading && !isAuthenticated) {
        // Redirect to login if not authenticated
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
          'x-auth-token': token,
        },
      };
      // If no assignee is selected, send null or omit the field
      const dataToSend = { ...formData };
      if (dataToSend.assignee === '') {
          delete dataToSend.assignee;
      }

      await axios.post('/api/tickets', dataToSend, config);
      setLoading(false);
      // Redirect to the project's ticket list after creation
      navigate(`/projects/${projectId}/tickets`);
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        // If unauthorized or forbidden, log out the user and redirect to login
        logout(); // Assuming logout is available from AuthContext
        navigate('/login');
      } else {
        setError(err.response ? err.response.data.msg : 'Server Error');
        setLoading(false);
      }
    }
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

   if (!isAuthenticated) {
    // Redirect to login if not authenticated after authLoading is false
    navigate('/login');
    return null; // Or a loading indicator if preferred
  }

  return (
    <div className="container mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Ticket</h1>
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
            id="assignee"
            name="assignee"
            value={assignee}
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
