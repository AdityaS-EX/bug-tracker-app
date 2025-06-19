import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, logout } = useContext(AuthContext); // Get auth context loading state and the logout function

  useEffect(() => {
    const fetchProjects = async () => {
      // Only attempt to fetch if auth context is not loading and user is authenticated
      if (!authLoading && isAuthenticated) {
        const token = localStorage.getItem('token');
        if (!token) {
          // This case should ideally be handled by App.jsx routing,
          // but as a fallback, we set error and stop loading.
          setLoading(false);
          setError('No authentication token found.');
          return;
        }

        try {
          const res = await axios.get('/api/projects', {
            headers: {
              'x-auth-token': token,
            },
          });
          setProjects(res.data);
          setLoading(false);
        } catch (err) {
          console.error(err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            // If unauthorized or forbidden, log out the user and redirect to login
            logout();
            navigate('/login');
          } else {
            setError('Failed to fetch projects.');
            setLoading(false);
          }
        }
      } else if (!authLoading && !isAuthenticated) {
         // If auth is not loading but user is not authenticated,
         // set component loading to false and projects to empty.
         setLoading(false);
         setProjects([]);
      }
       // If authLoading is true, do nothing, the component will show auth loading indicator

    };

    // Only run fetchProjects when authLoading state changes or isAuthenticated state changes
    fetchProjects();
  }, [isAuthenticated, authLoading, navigate]); // Depend on isAuthenticated, authLoading, and navigate

  // Show loading state from auth context first
  if (authLoading) {
      return <div className="text-center">Loading authentication...</div>;
  }

  // Then show component specific loading/error/empty state
  if (loading) {
    return <div className="text-center">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!isAuthenticated) {
       // If auth loading is false and user is not authenticated,
       // this component shouldn't be shown directly (App.jsx protects routes),
       // but as a safeguard, we show a message.
      return <div className="text-center">Please log in to view projects.</div>;
  }

  if (projects.length === 0) {
    return <div className="text-center">No projects found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project._id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
            {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Team Members:</h3>
              {
              // Check if teamMembers is populated and is an array
              Array.isArray(project.teamMembers) && project.teamMembers.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700">
                  {project.teamMembers.map(member => (
                    // Check if member is an object (populated) or just an ID
                    <li key={member._id || member}>{member.name || member} ({member.email || 'Email not available'})</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No team members yet.</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/projects/${project._id}`)}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
