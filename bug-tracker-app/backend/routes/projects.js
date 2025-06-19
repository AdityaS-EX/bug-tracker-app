const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User'); // Assuming User model is needed for invite

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description } = req.body;

  // Basic validation
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const newProject = new Project({
      title,
      description,
      teamMembers: [req.user.id] // Add creator as a team member
    });

    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('teamMembers', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a team member of this project
    if (!project.teamMembers.some(member => member._id.toString() === req.user.id)) {
         // We use .some() and toString() because teamMembers is populated,
         // so each member is an object with an _id, not just the user ID string.
         // If not populated, project.teamMembers.includes(req.user.id) would work.
      return res.status(403).json({ message: 'User not authorized to view this project' });
    }

    res.json(project);

  } catch (err) {
    console.error(err.message);
    // Check if the error is a CastError (invalid ObjectId format in URL)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/projects
// @desc    Get all projects for the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ teamMembers: req.user.id }).populate('teamMembers', 'name email'); // Populate team members
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/projects/:id
// @desc    Update a project
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a team member
    if (!project.teamMembers.includes(req.user.id)) {
      return res.status(403).json({ message: 'User not authorized to update this project' });
    }

    // Update fields if provided
    if (title) project.title = title;
    if (description) project.description = description;

    await project.save();
    res.json(project);

  } catch (err) {
    console.error(err.message);
    // Check if the error is a CastError (invalid ObjectId)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a team member
     if (!project.teamMembers.includes(req.user.id)) {
      return res.status(403).json({ message: 'User not authorized to delete this project' });
    }

    await project.deleteOne(); // Use deleteOne() or remove()
    res.json({ message: 'Project removed' });

  } catch (err) {
    console.error(err.message);
     if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/projects/:id/invite
// @desc    Invite a user to a project
// @access  Private
router.post('/:id/invite', auth, async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;

  if (!email) {
      return res.status(400).json({ message: 'User email is required' });
  }

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a team member (only team members can invite)
     if (!project.teamMembers.includes(req.user.id)) {
      return res.status(403).json({ message: 'User not authorized to invite members to this project' });
    }

    const userToInvite = await User.findOne({ email });

    if (!userToInvite) {
      return res.status(404).json({ message: 'User with that email not found' });
    }

    // Check if user is already a team member
    if (project.teamMembers.includes(userToInvite.id)) {
        return res.status(400).json({ message: 'User is already a team member' });
    }

    project.teamMembers.push(userToInvite.id);
    await project.save();

    // Optionally populate to return updated project with team members
    await project.populate('teamMembers', 'name email').execPopulate(); // populate after save

    res.json(project);

  } catch (err) {
    console.error(err.message);
     if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
