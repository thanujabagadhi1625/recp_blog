const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const { getCommentsByRecipe, addComment } = require('../controllers/commentController');

router.get('/recipe/:recipeId', getCommentsByRecipe);
router.post('/recipe/:recipeId', authMiddleware, upload.single('attachment'), uploadToCloudinary, addComment);

module.exports = router;
