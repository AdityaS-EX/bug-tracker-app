import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; // Import Dashboard
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail'; // Import ProjectDetail
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetail from './components/TicketDetail'; // Import TicketDetail component
import KanbanBoard from './components/KanbanBoard'; // Import KanbanBoard component

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Routes outside the dashboard layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard layout for authenticated users */}
          <Route path="/" element={<Dashboard />}>
            {/* Nested routes rendered within the Dashboard's content area */}
            <Route index element={<ProjectList />} /> {/* Default route for Dashboard */}
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="projects/:projectId/tickets" element={<TicketList />} />
            <Route path="projects/:projectId/tickets/new" element={<TicketForm />} />
            <Route path="projects/:projectId/tickets/:ticketId" element={<TicketDetail />} />
            <Route path="projects/:projectId/kanban" element={<KanbanBoard />} /> {/* Add Kanban Board route */}
            {/* Add more nested routes as needed */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;