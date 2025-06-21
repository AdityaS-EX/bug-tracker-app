import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, user, logout } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // State for removing members
  const [removeMemberSuccess, setRemoveMemberSuccess] = useState('');
  const [removeMemberError, setRemoveMemberError] = useState('');

  const fetchProjectDetails = useCallback(async () => {
    if (!authLoading && isAuthenticated && projectId) {
      setLoading(true); 
      setError(null); 
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };
        const res = await axios.get(`/api/projects/${projectId}`, config);
        setProject(res.data);
      } catch (err) {
        console.error('Fetch Project Details Error:', err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          if (logout) logout(); 
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Server Error fetching project details');
        }
      } finally {
        setLoading(false);
      }
    } else if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, projectId, navigate, logout]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      setInviteError('Please enter an email to invite.');
      return;
    }
    setInviteError('');
    setInviteSuccess('');
    setRemoveMemberError(''); // Clear other messages
    setRemoveMemberSuccess('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };
      const body = { email: inviteEmail };
      await axios.post(`/api/projects/${projectId}/invite`, body, config);
      setInviteSuccess(`User ${inviteEmail} invited successfully! Team list updated.`);
      setInviteEmail('');
      fetchProjectDetails(); 
    } catch (err) {
      console.error('Invite Member Error:', err);
      setInviteError(err.response?.data?.message || 'Failed to invite user.');
    }
  };

  const handleRemoveMember = async (memberIdToRemove) => {
    if (!window.confirm('Are you sure you want to remove this member from the project? They will also be unassigned from any tickets in this project.')) {
      return;
    }
    setInviteError(''); 
    setInviteSuccess('');
    setRemoveMemberError('');
    setRemoveMemberSuccess('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };
      await axios.delete(`/api/projects/${projectId}/members/${memberIdToRemove}`, config);
      setRemoveMemberSuccess('Member removed successfully. Team list and relevant tickets updated.');
      fetchProjectDetails(); // Refresh project details
    } catch (err) {
      console.error('Remove Member Error:', err);
      setRemoveMemberError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading project details...</div>;
  }

  if (!isAuthenticated) {
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
      <p className="text-gray-700 mb-4">{project.description || 'No description provided.'}</p>

      <h2 className="text-xl font-semibold mb-2">Team Members:</h2>
      {removeMemberError && <p className="text-red-500 mb-2">{removeMemberError}</p>}
      {removeMemberSuccess && <p className="text-green-500 mb-2">{removeMemberSuccess}</p>}
      {project.teamMembers && project.teamMembers.length > 0 ? (
        <ul className="list-disc list-inside mb-4">
          {project.teamMembers.map((member) => (
            <li key={member._id} className="flex justify-between items-center py-1">
              <span>{member.name} ({member.email})</span>
              {user && user.role === 'Admin' && user._id !== member._id && (
                <button 
                  onClick={() => handleRemoveMember(member._id)}
                  className="ml-4 bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 mb-4">No team members yet.</p>
      )}

      {user && user.role === 'Admin' && (
        <div className="my-6 p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-2">Add Member to Project</h3>
          {inviteError && <p className="text-red-500 mb-2">{inviteError}</p>}
          {inviteSuccess && <p className="text-green-500 mb-2">{inviteSuccess}</p>}
          <form onSubmit={handleInviteMember} className="flex items-center">
            <input 
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="User email to invite"
              className="p-2 border rounded-l-md flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button 
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r-md"
            >
              Add Member
            </button>
          </form>
        </div>
      )}

      <div className="flex space-x-4 mt-4">
        <button
          onClick={() => navigate(`/dashboard/projects/${projectId}/tickets`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          View Tickets
        </button>
        <button
          onClick={() => navigate(`/dashboard/projects/${projectId}/tickets/new`)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create New Ticket
        </button>
         <button
          onClick={() => navigate(`/dashboard/projects/${projectId}/kanban`)}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          View Kanban Board
        </button>
      </div>
    </div>
  );
};

export default ProjectDetail;
