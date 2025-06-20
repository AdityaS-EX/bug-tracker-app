import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const CommentSection = () => {
  const { ticketId } = useParams(); // Get ticket ID from URL parameters
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentToDeleteId, setCommentToDeleteId] = useState(null); // State for comment pending deletion
  const [hoveredCommentId, setHoveredCommentId] = useState(null); // State for comment being hovered
  const [showTooltip, setShowTooltip] = useState(false); // State to control tooltip visibility
  const { user, logout } = useContext(AuthContext); // Access user and logout from AuthContext

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`/api/comments?ticketId=${ticketId}`);
        // Sort comments by createdAt date before setting
        setComments(res.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } catch (err) {
        console.error(err);
        // Handle 401/403 errors
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        }
      }
    };

    if (ticketId) {
      fetchComments();
    }
  }, [ticketId, logout]); // Dependency array includes ticketId and logout

  const handleAddComment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/comments', {
        ticketId,
        text: newCommentText
      });
      // Add the new comment to the local state and sort. Assuming backend returns populated user.
       const addedComment = res.data; // Assuming the response includes the populated user
       setComments([...comments, addedComment].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      setNewCommentText(''); // Clear the input field
    } catch (err) {
      console.error(err);
      // Handle 401/403 errors
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logout();
      }
    }
  };

  const handleEditComment = async (e, commentId) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/comments/${commentId}`, { text: editingCommentText });
      // Update the comment in the local state and sort. Assuming backend returns populated user.
      const updatedComment = res.data; // Assuming the response includes the populated user
      setComments(comments.map(comment => comment._id === commentId ? updatedComment : comment).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      setEditingCommentId(null); // Exit editing mode
      setEditingCommentText('');
    } catch (err) {
      console.error(err);
       if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        } else {
           // Handle other errors (e.g., show an error message to the user)
           console.error('Error updating comment:', err.response?.data || err.message);
        }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      // Remove the comment from the local state
      setComments(comments.filter(comment => comment._id !== commentId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (err) {
      console.error(err);
       if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        } else {
           // Handle other errors (e.g., show an error message to the user)
           console.error('Error deleting comment:', err.response?.data || err.message);
        }
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>

      {/* Display existing comments */}
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment._id} className="bg-gray-100 p-3 rounded-md">
            {editingCommentId === comment._id ? (
              // Edit form
              <form onSubmit={(e) => handleEditComment(e, comment._id)} className="flex flex-col">
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300 mb-2"
                  rows="2"
                  value={editingCommentText}
                  onChange={(e) => setEditingCommentText(e.target.value)}
                  required
                ></textarea>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingCommentId(null)}
                    className="mr-2 px-3 py-1 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              // Display comment
              <div>
                <p className="text-gray-800">{comment.text}</p>
                {/* Display author's name and email on hover */}
                <p className="text-sm text-gray-500">
                  by{' '}
                  <span
                    className="font-medium text-gray-700 cursor-pointer relative"
                    onMouseEnter={() => { setHoveredCommentId(comment._id); setShowTooltip(true); }}
                    onMouseLeave={() => { setHoveredCommentId(null); setShowTooltip(false); }}
                  >
                    {comment.userId?.name || 'Unknown User'}
                    {/* Tooltip for email */}
                    {hoveredCommentId === comment._id && showTooltip && comment.userId?.email && (
                      <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-black text-white text-xs rounded whitespace-nowrap cursor-pointer"
                           onClick={() => navigator.clipboard.writeText(comment.userId.email).then(() => alert('Email copied!')).catch(err => console.error('Failed to copy:', err))}
                      >
                        {comment.userId.email} (Click to copy)
                      </div>
                    )}
                  </span>{' '}
                  on {new Date(comment.createdAt).toLocaleString()}
                  </p>
                {/* Edit and Delete buttons - only show if current user is the author */}
                {/* Console logs for debugging user ID match */}
                {/* console.log('Comment Author ID:', comment.userId?._id) */}
                {/* console.log('Logged-in User ID:', user?._id) */}
                {/* console.log('Is author:', user && comment.userId && user._id === comment.userId._id) */}
                {console.log('Logged-in User ID:', user?._id)}
                {console.log('Is author:', user && comment.userId && user._id === comment.userId._id)}
                {user && comment.userId && user._id === comment.userId._id && (
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditingCommentText(comment.text);
                      }}
                      className="text-sm text-blue-500 hover:text-blue-700 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setCommentToDeleteId(comment._id)} // Set comment to delete ID to show confirmation
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {commentToDeleteId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Deletion</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this comment?
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  id="confirm-delete-btn"
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={() => {
                    handleDeleteComment(commentToDeleteId);
                    setCommentToDeleteId(null); // Close modal after confirming deletion
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  id="cancel-delete-btn"
                  className="mt-3 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md w-full shadow-sm outline-none hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onClick={() => setCommentToDeleteId(null)} // Close modal without deleting
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add new comment form */}
      <form onSubmit={handleAddComment} className="mt-4">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300"
          rows="3"
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          required
        ></textarea>
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add Comment
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
