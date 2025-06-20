import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { DndContext, closestCorners, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AuthContext } from '../context/AuthContext';

// Draggable Ticket Component
const DraggableTicket = ({ ticket }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ticket._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-100 p-3 rounded-md shadow-sm mb-3 cursor-grab"
    >
      <h4 className="text-md font-semibold mb-1">{ticket.title}</h4>
      <p className="text-sm text-gray-600 mb-1">Priority: {ticket.priority}</p>
      {ticket.assignee && (
        <p className="text-sm text-gray-600">Assignee: {ticket.assignee.name}</p>
      )}
    </div>
  );
};

// Kanban Column Component
const KanbanColumn = ({ id, title, tickets }) => {
  const { setNodeRef } = useDroppable({ id }); // Make the column a droppable area

  return (
    <div ref={setNodeRef} className="flex-1 bg-gray-200 rounded-md p-4 mr-4 last:mr-0">
      <h3 className="text-lg font-bold mb-4 text-center">{title}</h3>
      <SortableContext id={id} items={tickets.map(ticket => ticket._id)} strategy={verticalListSortingStrategy}>
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <DraggableTicket key={ticket._id} ticket={ticket} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanBoard = () => {
  const { projectId } = useParams();
  const { isAuthenticated, authLoading } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columnOrder = ['To Do', 'In Progress', 'Done']; // Define column order

  // Group tickets by status for rendering
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const status = ticket.status || 'To Do'; // Default to 'To Do' if status is missing or unexpected
    if (columnOrder.includes(status)) {
      acc[status].push(ticket);
    } else {
      // Place tickets with unexpected status in 'To Do'
      acc['To Do'].push(ticket);
    }
    return acc;
  }, {
    'To Do': [],
    'In Progress': [],
    'Done': [],
  });

  useEffect(() => {
    const fetchTickets = async () => {
      if (!authLoading && isAuthenticated && projectId) {
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            params: {
              projectId: projectId
            }
          };
          const res = await axios.get('/api/tickets', config);
          setTickets(res.data);
          setLoading(false);
        } catch (err) {
          console.error(err);
          // Handle 401/403 errors specifically if needed, similar to ProjectDetail
          setError(err.response ? err.response.data.msg : 'Server Error');
          setLoading(false);
        }
      }
    };

    fetchTickets();
  }, [isAuthenticated, authLoading, projectId]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // If dropped outside of a droppable area or not over a valid column, do nothing
    if (!over || !columnOrder.includes(over.id)) return;

    const droppedTicketId = active.id;
    const targetColumnId = over.id; // This should now be the column ID (status)

    // Find the ticket that was dragged
    const draggedTicket = tickets.find(ticket => ticket._id === droppedTicketId);

    // If the ticket was dropped in the same column or not found, do nothing
    if (!draggedTicket || draggedTicket.status === targetColumnId) {
      return;
    }

    // Optimistically update the UI
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket._id === droppedTicketId ? { ...ticket, status: targetColumnId } : ticket
      )
    );

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      // Update the ticket status on the backend
      await axios.put(`/api/tickets/${droppedTicketId}`, { status: targetColumnId }, config);

      // If the backend update is successful, the optimistic update is fine.
      // If it fails, the useEffect will refetch and correct the state.

    } catch (err) {
      console.error(err);
      // Revert the UI change if the API call fails
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket._id === droppedTicketId ? { ...ticket, status: draggedTicket.status } : ticket
        )
      );
      setError('Failed to update ticket status');
    }
  };

  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading tickets...</div>;
  };

  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">Error: {error}</div>;
  };

  return (
    <div className="container mx-auto mt-8 p-4 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Kanban Board</h2>
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex">
          {columnOrder.map((columnKey) => (
            <KanbanColumn key={columnKey} id={columnKey} title={columnKey} tickets={groupedTickets[columnKey] || []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
