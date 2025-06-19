import React, { useContext, useState, useEffect } from 'react';
import { useParams, useLocation, Outlet, Link } from 'react-router-dom'; // Import Outlet and Link
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import axios from 'axios';

const Dashboard = () => {
  const { isAuthenticated, authLoading } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const location = useLocation();
  const { projectId } = useParams();

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!authLoading && isAuthenticated) {
        try {
          const res = await axios.get('/api/projects');
          setProjects(res.data);
          // Set a default selected project if projectId is not in the URL
          if (!projectId && res.data.length > 0) {
            setSelectedProject(res.data[0]);
          }
        } catch (err) {
          console.error(err);
          // Handle error, maybe redirect to login if 401/403
        }
      }
    };

    fetchProjects();
  }, [isAuthenticated, authLoading, projectId]);

  // Update selected project when projectId in URL changes
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p._id === projectId);
      setSelectedProject(project);
    } else if (!projectId && projects.length > 0) {
       setSelectedProject(projects[0]);
    }
  }, [projectId, projects]);

  // Determine breadcrumbs (basic implementation based on URL)
  const renderBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return (
      <div className="text-gray-600 text-sm">
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          // Basic mapping for known routes, could be more sophisticated
          let displayName = name;
          if (name === 'projects' && selectedProject) {
            displayName = selectedProject.title; // Or list of projects
          } else if (name === projectId && selectedProject) {
             displayName = selectedProject.title; // Project name for project detail route
          } else if (name === 'tickets' && selectedProject) {
             displayName = 'Tickets'; // Tickets overview for project
          } else if (name === 'new' && selectedProject) {
             displayName = 'New Ticket'; // New ticket for project
          }
           else if (name === location.pathname.split('/')[location.pathname.split('/').length -1] && location.pathname.includes('/tickets/')){
             // This is a basic attempt to show ticket ID in breadcrumb if on a ticket detail page
             displayName = `Ticket ${name}`;
           }

          return isLast ? (
            <span key={name}>{displayName}</span>
          ) : (
            <>
              <Link to={routeTo} key={name} className="hover:text-blue-600">
                {displayName}
              </Link>
              <span className="mx-1">/</span>
            </>
          );
        })}
      </div>
    );
  };

  if (authLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return null; // Or a loading spinner, useNavigate will handle redirect
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white border-b">
          {/* Project Selector Dropdown (Placeholder) */}
          <div className="relative inline-block text-gray-700">
             {/* Basic Dropdown - Functionality will be added later */}
            <select
              className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
              value={selectedProject ? selectedProject._id : ''}
              onChange={(e) => {
                const project = projects.find(p => p._id === e.target.value);
                setSelectedProject(project);
                // Optional: Navigate to the project dashboard or project detail page
                 if (project) { /* navigate(`/projects/${project._id}`); */ }
              }}
            >
              <option value="" disabled>Select a project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.title}</option>
              ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* Breadcrumbs */}
          {renderBreadcrumbs()}
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
          <div className="container mx-auto">
            {/* Render nested routes content here */}
            <Outlet /> 
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;