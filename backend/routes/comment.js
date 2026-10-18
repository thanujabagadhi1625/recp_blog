const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadAttachment, uploadToCloudinary } = require('../middleware/upload');
const { verifyRecipeExists } = require('../middleware/preCheck');
const { validateComment, validateObjectId } = require('../middleware/validation');
const { getCommentsByRecipe, addComment } = require('../controllers/commentController');

router.get('/recipe/:recipeId', validateObjectId('recipeId'), getCommentsByRecipe);

router.post(
  '/recipe/:recipeId',
  authMiddleware,
  validateObjectId('recipeId'),
  verifyRecipeExists,
  uploadAttachment.single('attachment'),
  validateComment,
  uploadToCloudinary,
  addComment
);

module.exports = router;
