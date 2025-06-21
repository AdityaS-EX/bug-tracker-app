import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Get user from AuthContext to check role
  const { isAuthenticated, loading: authLoading, logout, user } = useContext(AuthContext);

  const fetchProjects = useCallback(async () => {
    if (!authLoading && isAuthenticated) {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setError('No authentication token found.');
        return;
      }
      try {
        setLoading(true); // Set loading true at the start of fetch
        const res = await axios.get('/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setProjects(res.data);
      } catch (err) {
        console.error(err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
          navigate('/login');
        } else {
          setError('Failed to fetch projects.');
        }
      } finally {
        setLoading(false);
      }
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      setProjects([]);
    }
  }, [authLoading, isAuthenticated, logout, navigate]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (projectIdToDelete) => {
    if (window.confirm('Are you sure you want to delete this project and all its associated tickets?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/projects/${projectIdToDelete}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        // Refresh project list by calling fetchProjects again
        fetchProjects(); 
      } catch (err) {
        console.error('Failed to delete project', err);
        setError(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  if (authLoading) {
      return <div className="text-center">Loading authentication...</div>;
  }

  if (loading) {
    return <div className="text-center">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!isAuthenticated) {
      return <div className="text-center">Please log in to view projects.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Projects</h1>
        {user && user.role === 'Admin' && (
          <button
            onClick={() => navigate('/dashboard/admin/projects/new')}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create New Project
          </button>
        )}
      </div>
      {projects.length === 0 && !loading && (
        <div className="text-center">No projects found.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project._id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
            {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Team Members:</h3>
              {
              Array.isArray(project.teamMembers) && project.teamMembers.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700">
                  {project.teamMembers.map(member => (
                    <li key={member._id || member}>{member.name || member} ({member.email || 'Email not available'})</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No team members yet.</p>
              )}
            </div>
            <div className="flex justify-start space-x-2 mt-4">
              <button
                onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                View Details
              </button>
              {user && user.role === 'Admin' && (
                <button
                  onClick={() => handleDeleteProject(project._id)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
