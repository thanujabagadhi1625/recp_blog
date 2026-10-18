const Comment = require('../models/comment');
const Recipe = require('../models/recipe');
const User = require('../models/user');

const getCommentsByRecipe = async (req, res) => {
  try {
    const comments = await Comment.find({ recipeId: req.params.recipeId }).sort({ createdAt: -1 }).limit(100).lean();
    comments.reverse();
    const commentMap = {};
    const nested = [];

    comments.forEach((comment) => {
      comment.children = [];
      commentMap[comment._id.toString()] = comment;
    });

    comments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap[comment.parentId.toString()];
        if (parent) {
          parent.children.push(comment);
        } else {
          nested.push(comment);
        }
      } else {
        nested.push(comment);
      }
    });
    return res.status(200).json(nested);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error loading comments' });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const recipe = req.recipe || await Recipe.findById(req.params.recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    const user = await User.findById(req.userId);
    const authorName = user?.name || 'Anonymous';

    const comment = new Comment({
      recipeId: req.params.recipeId,
      userId: req.userId,
      parentId: parentId || null,
      author: authorName,
      text: text.trim(),
      attachmentUrl: req.file ? req.file.cloudinaryUrl : undefined,
      attachmentType: req.file ? req.file.mimetype : undefined,
    });

    const savedComment = await comment.save();
    return res.status(201).json(savedComment);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error creating comment' });
  }
};

module.exports = {
  getCommentsByRecipe,
  addComment,
};
