import React, { useContext } from 'react';
import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetail from './components/TicketDetail';
import KanbanBoard from './components/KanbanBoard';
import UserManagement from './components/UserManagement';
import TermsAndConditions from './components/TermsAndConditions';
import AccountControl from './components/AccountControl';
import HomePage from './components/HomePage';
import ProjectForm from './components/ProjectForm'; // Import ProjectForm

// Wrapper for routes that should only be accessible if NOT authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useContext(AuthContext);
  if (authLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }
  return !isAuthenticated ? children : <Navigate to='/dashboard' replace />;
};

// Wrapper for routes that should only be accessible if authenticated
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useContext(AuthContext);
  if (authLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }
  return isAuthenticated ? children : <Navigate to='/login' replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<PublicRoute><HomePage /></PublicRoute>} />
          <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
          <Route path='/register' element={<PublicRoute><Register /></PublicRoute>} />
          <Route path='/terms-and-conditions' element={<TermsAndConditions />} /> {/* T&C can be public */}

          {/* Protected Routes - All under /dashboard prefix */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard /> {/* Dashboard component directly renders its Outlet for children */}
              </ProtectedRoute>
            }
          >
            <Route index element={<ProjectList />} /> {/* Default for /dashboard */}
            <Route path='projects' element={<ProjectList />} />
            <Route path='projects/:projectId' element={<ProjectDetail />} />
            <Route path='projects/:projectId/tickets' element={<TicketList />} />
            <Route path='projects/:projectId/tickets/new' element={<TicketForm />} />
            <Route path='projects/:projectId/tickets/:ticketId' element={<TicketDetail />} />
            <Route path='projects/:projectId/kanban' element={<KanbanBoard />} />
            <Route path='users' element={<UserManagement />} />
            <Route path='account' element={<AccountControl />} />
            <Route path='admin/projects/new' element={<ProjectForm />} /> {/* Route for new project form */}
            {/* Fallback for unknown /dashboard sub-routes, redirect to dashboard index */}
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
          </Route>

          {/* Catch-all for any other path not matched, redirect appropriately */}
          <Route path='*' element={<NavigateToAppropriatePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Helper to redirect to home or dashboard based on auth for unknown paths
const NavigateToAppropriatePage = () => {
  const { isAuthenticated, authLoading } = useContext(AuthContext);
  if (authLoading) {
    return <div>Loading...</div>;
  }
  return isAuthenticated ? <Navigate to='/dashboard' replace /> : <Navigate to='/' replace />;
};

export default App;
