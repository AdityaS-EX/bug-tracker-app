import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCorners, useDroppable, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'; // Added DragOverlay and sensor imports
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'; // Added arrayMove
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AuthContext } from '../context/AuthContext';

// Draggable Ticket Component
const DraggableTicket = ({ ticket, isDragging }) => { // Added isDragging prop
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: ticket._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Make original item semi-transparent when dragging overlay is active
    zIndex: isOver ? 10 : 'auto', // Attempt to bring item slightly forward if something is dragging over it (might not be needed with DragOverlay)
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-3 rounded-md shadow-sm mb-3 cursor-grab ${isDragging ? 'opacity-50' : ''}`}
    >
      <h4 className="text-md font-semibold mb-1">{ticket.title}</h4>
      <p className="text-sm text-gray-600 mb-1">Priority: {ticket.priority}</p>
      {ticket.assignee ? (
        <p className="text-sm text-gray-600">Assignee: {ticket.assignee.name}</p>
      ) : (
        <p className="text-sm text-gray-500">Unassigned</p>
      )}
    </div>
  );
};

// Kanban Column Component
const KanbanColumn = ({ id, title, tickets }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 bg-gray-100 rounded-md p-4 min-h-[600px] flex flex-col ${isOver ? 'bg-gray-200' : ''}`}
    >
      <h3 className="text-lg font-bold mb-4 text-center text-gray-700">{title}</h3>
      <SortableContext id={id} items={tickets.map(ticket => ticket._id)} strategy={verticalListSortingStrategy}>
        <div className="ticket-list flex-grow overflow-y-auto p-1"> {/* Added padding for scrollbar visibility */}
          {tickets.map((ticket) => (
            // Pass isDragging from the active drag state if we want to style the original differently
            // For now, useSortable's own isDragging will apply to the source item
            <DraggableTicket key={ticket._id} ticket={ticket} />
          ))}
          {tickets.length === 0 && (
            <div className="text-center text-gray-400 py-4">Drop tickets here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, authLoading } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null); // ID of the currently dragged ticket

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const columnOrder = ['To Do', 'In Progress', 'Done'];

  useEffect(() => {
    const fetchTickets = async () => {
      if (!authLoading && isAuthenticated && projectId) {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const config = {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { projectId }
          };
          const res = await axios.get('/api/tickets', config);
          setTickets(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.msg || 'Server Error fetching tickets');
          setTickets([]); // Ensure tickets is an array on error
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTickets();
  }, [isAuthenticated, authLoading, projectId]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    setActiveId(null); // Clear activeId regardless of drop outcome
    const { active, over } = event;

    console.log('[DragEnd] Event:', event);
    console.log('[DragEnd] Active ID:', active.id, 'Over ID:', over ? over.id : 'null');

    if (!over) {
      console.log('[DragEnd] No drop target (over is null). Aborting.');
      return;
    }
    if (!columnOrder.includes(over.id)) {
      console.log(`[DragEnd] Invalid drop target: ${over.id}. Aborting.`);
      return;
    }

    const droppedTicketId = active.id;
    const targetColumnId = over.id; // This is the status string like 'To Do', 'In Progress', 'Done'
    const originalTicket = tickets.find(ticket => ticket._id === droppedTicketId);

    console.log('[DragEnd] Dropped Ticket ID:', droppedTicketId);
    console.log('[DragEnd] Target Column ID (Status):', targetColumnId);
    console.log('[DragEnd] Original Ticket:', originalTicket);

    if (!originalTicket) {
      console.log('[DragEnd] Original ticket not found. Aborting.');
      return;
    }
    if (originalTicket.status === targetColumnId) {
      console.log(`[DragEnd] Ticket dropped in the same column ('${targetColumnId}'). No change needed.`);
      return;
    }

    console.log(`[DragEnd] Optimistically updating ticket ${droppedTicketId} from ${originalTicket.status} to ${targetColumnId}`);
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket._id === droppedTicketId ? { ...ticket, status: targetColumnId } : ticket
      )
    );

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.put(`/api/tickets/${droppedTicketId}`, { status: targetColumnId }, config);
    } catch (err) {
      console.error(err);
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket._id === droppedTicketId ? { ...ticket, status: originalTicket.status } : ticket // Revert to original status
        )
      );
      setError('Failed to update ticket status. Change reverted.');
    }
  };
  
  const activeTicket = activeId ? tickets.find(ticket => ticket._id === activeId) : null;

  // Group tickets by status for rendering
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const status = ticket.status || 'To Do';
    if (!acc[status]) acc[status] = [];
    acc[status].push(ticket);
    return acc;
  }, {'To Do': [], 'In Progress': [], 'Done': []});


  if (authLoading || loading) {
    return <div className="container mx-auto mt-8 p-4">Loading tickets...</div>;
  }

  if (error) {
    return <div className="container mx-auto mt-8 p-4 text-red-700">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto mt-8 p-4 bg-white rounded shadow-md">
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
        <h2 className="text-2xl font-bold">Kanban Board</h2>
      </div>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4">
          {columnOrder.map((columnKey) => (
            <KanbanColumn 
              key={columnKey} 
              id={columnKey} 
              title={columnKey} 
              tickets={groupedTickets[columnKey] || []} 
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}> 
          {activeTicket ? (
            <DraggableTicket ticket={activeTicket} isDragging={true} /> // Pass active ticket to overlay
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
