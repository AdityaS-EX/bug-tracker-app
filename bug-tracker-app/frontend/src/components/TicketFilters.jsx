import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const TicketFilters = ({ projectId, setTickets, teamMembers }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');

  const { user } = useContext(AuthContext);

  const fetchFilteredTickets = async () => {
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        params: {
          projectId,
          ...(statusFilter && { status: statusFilter }),
          ...(priorityFilter && { priority: priorityFilter }),
          ...(assigneeFilter && { assignee: assigneeFilter === 'unassigned' ? 'unassigned' : assigneeFilter }),
          ...(keywordSearch && { keyword: keywordSearch }),
        },
      };
      const res = await axios.get('/api/tickets', config);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFilteredTickets();
  }, [statusFilter, priorityFilter, assigneeFilter, keywordSearch, projectId]); // Depend on filters and search keyword

  const handleResetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setKeywordSearch('');
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-100 rounded-md mb-4">
      {/* Status Filter */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <select
          id="status"
          name="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
        <select
          id="priority"
          name="priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Assignee Filter */}
      <div>
        <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Assignee</label>
        <select
          id="assignee"
          name="assignee"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {teamMembers.map(member => (
            <option key={member._id} value={member._id}>{member.name}</option>
          ))}
        </select>
      </div>

      {/* Keyword Search */}
      <div className="flex-grow">
         <label htmlFor="keyword" className="block text-sm font-medium text-gray-700">Search Keyword</label>
         <input
            type="text"
            id="keyword"
            name="keyword"
            value={keywordSearch}
            onChange={(e) => setKeywordSearch(e.target.value)}
            placeholder="Search by title or description"
            className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
         />
      </div>

      {/* Reset Button */}
      <div>
        <button
          onClick={handleResetFilters}
          className="mt-5 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default TicketFilters;