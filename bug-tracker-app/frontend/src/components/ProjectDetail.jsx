import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
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
          };
          const res = await axios.get(`/api/projects/${projectId}`, config);
          setProject(res.data);
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

    fetchProjectDetails();
  }, [isAuthenticated, authLoading, projectId, navigate]);

  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading project details...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated after authLoading is false
    // This case is handled in useEffect, but this prevents rendering issues
    return null;
  }

  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">Error: {error}</div>;
  }

  if (!project) {
      return <div className="container mx-auto mt-8 p-4">Project not found.</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4 bg-white rounded shadow-md">
      <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
      <p className="text-gray-700 mb-4">{project.description}</p>

      <h2 className="text-xl font-semibold mb-2">Team Members:</h2>
      <ul className="list-disc list-inside mb-4">
        {project.teamMembers.map((member) => (
          <li key={member._id}>{member.name} ({member.email})</li>
        ))}
      </ul>

      <div className="flex space-x-4">
        <button
          onClick={() => navigate(`/projects/${projectId}/tickets`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          View Tickets
        </button>
        <button
          onClick={() => navigate(`/projects/${projectId}/tickets/new`)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create New Ticket
        </button>
         <button
          onClick={() => navigate(`/projects/${projectId}/kanban`)}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          View Kanban Board
        </button>
      </div>
    </div>
  );
};

export default ProjectDetail;
