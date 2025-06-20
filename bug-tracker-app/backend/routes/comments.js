const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');

// @route    POST api/comments
// @desc     Add a comment to a ticket
// @access   Private
router.post('/', auth, async (req, res) => {
  const { ticketId, text } = req.body;

  try {
    const newComment = new Comment({
      ticketId,
      text,
      userId: req.user.id // User ID comes from the auth middleware
    });



    let comment = await newComment.save();
    // Populate the user data after saving
    comment = await comment.populate('userId', ['name', 'email']);
    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route    GET api/comments
// @desc     Get comments for a ticket
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ ticketId: req.query.ticketId })
      .populate('userId', ['name', 'email'])
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/comments/:id
// @desc     Update a comment
// @access   Private
router.put('/:id', auth, async (req, res) => {
  const { text } = req.body;

  try {
    let comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check user
    if (comment.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }


    comment.text = text;
    await comment.save();

    // Populate the user data after saving
    comment = await comment.populate('userId', ['name', 'email']);

    res.json(comment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/comments/:id
// @desc     Delete a comment
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check user
    if (comment.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Comment.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Comment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Comment not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;