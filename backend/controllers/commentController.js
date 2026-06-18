const Comment = require('../models/comment');
const Recipe = require('../models/recipe');
const User = require('../models/user');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_URL) cloudinary.config({ url: process.env.CLOUDINARY_URL });

const getCommentsByRecipe = async (req, res) => {
  try {
    const comments = await Comment.find({ recipeId: req.params.recipeId }).sort({ createdAt: 1 }).lean();
    const commentMap = {};
    const nested = [];

    comments.forEach((comment) => {
      comment.children = [];
      commentMap[comment._id] = comment;
    });

    comments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap[comment.parentId.toString()];
        if (parent) parent.children.push(comment);
      } else {
        nested.push(comment);
      }
    });
    return res.status(200).json(nested);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error loading comments' });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { parentId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const recipe = await Recipe.findById(req.params.recipeId);
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
      attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      attachmentType: req.file ? req.file.mimetype : undefined,
    });

    const savedComment = await comment.save();
    return res.status(201).json(savedComment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating comment' });
  }
};

module.exports = {
  getCommentsByRecipe,
  addComment,
};
