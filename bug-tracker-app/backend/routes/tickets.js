const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const User = require('../models/User');

// @route POST /api/tickets
// @desc Create a ticket
// @access Private
router.post('/', auth, async (req, res) => {
  const { title, description, priority, projectId, assignee } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a member of the project
    if (!project.teamMembers.includes(req.user.id)) {
      return res.status(403).json({ msg: 'User is not a member of this project' });
    }

    const newTicket = new Ticket({
      title,
      description,
      priority,
      projectId,
      assignee: assignee || null, // Assignee can be optional initially
    });

    const ticket = await newTicket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route GET /api/tickets/:id
// @desc Get a ticket by ID
// @access Private
router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('assignee', 'name email');

        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        // Check if user is a member of the project the ticket belongs to
        const project = await Project.findById(ticket.projectId);
        if (!project) {
             // This should not happen if ticket has a valid projectId, but as a safeguard
            return res.status(404).json({ msg: 'Associated project not found' });
        }

         if (!project.teamMembers.some(member => member.toString() === req.user.id)) {
             // We use .some() and toString() to compare the populated teamMember IDs with the user ID
            return res.status(403).json({ msg: 'User not authorized to view this ticket' });
        }

        res.json(ticket);

    } catch (err) {
        console.error(err.message);
        // Check if the error is a CastError (invalid ObjectId format in URL)
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Ticket not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route GET /api/tickets
// @desc Get tickets by project ID
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, status, priority, assignee, keyword } = req.query;

    if (!projectId) {
      return res.status(400).json({ msg: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is a member of the project
    if (!project.teamMembers.includes(req.user.id)) {
      return res.status(403).json({ msg: 'User is not a member of this project' });
    }

    const filter = { projectId };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignee) {
       // Ensure assignee is treated as null if "unassigned" or similar is passed
       filter.assignee = assignee === 'unassigned' ? null : assignee;
    }

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(filter).populate('assignee', 'name email');
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT /api/tickets/:id
// @desc Update a ticket
// @access Private
router.put('/:id', auth, async (req, res) => {
  const { title, description, priority, status, assignee } = req.body;

  // Build ticket object
  const ticketFields = {};
  if (title) ticketFields.title = title;
  if (description) ticketFields.description = description;
  if (priority) ticketFields.priority = priority;
  if (status) ticketFields.status = status;
  if (assignee) ticketFields.assignee = assignee;

  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    // Check if user is a member of the project the ticket belongs to
    const project = await Project.findById(ticket.projectId);
    if (!project.teamMembers.includes(req.user.id)) {
        return res.status(403).json({ msg: 'User is not authorized to update this ticket' });
    }

    ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $set: ticketFields },
      { new: true }
    ).populate('assignee', 'name email');

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route DELETE /api/tickets/:id
// @desc Delete a ticket
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    // Check if user is a member of the project the ticket belongs to
    const project = await Project.findById(ticket.projectId);
    if (!project.teamMembers.includes(req.user.id)) {
        return res.status(403).json({ msg: 'User is not authorized to delete this ticket' });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Ticket removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route PUT /api/tickets/:id/assign
// @desc Assign user to a ticket
// @access Private
router.put('/:id/assign', auth, async (req, res) => {
    const { userId } = req.body;

    try {
      let ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }

      // Check if user is a member of the project the ticket belongs to
      const project = await Project.findById(ticket.projectId);
      if (!project.teamMembers.includes(req.user.id)) {
          return res.status(403).json({ msg: 'User is not authorized to assign this ticket' });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ msg: 'User not found' });
      }

      // Check if the user being assigned is a member of the project
      if (!project.teamMembers.includes(userId)) {
        return res.status(400).json({ msg: 'Assigned user is not a member of this project' });
      }

      ticket.assignee = userId;
      await ticket.save();

      // Populate the assignee field before sending the response
      ticket = await ticket.populate('assignee', 'name email');

      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


module.exports = router;