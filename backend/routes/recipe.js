const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');
const {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  likeRecipe,
  dislikeRecipe,
  getUserRecipes
} = require('../controllers/recipeController');

router.get('/', getRecipes);
router.get('/user/:userId', getUserRecipes);
router.get('/:id', getRecipe);

router.post('/', authMiddleware, upload.single('coverImage'), uploadToCloudinary, addRecipe);
router.put('/:id', authMiddleware, upload.single('coverImage'), uploadToCloudinary, editRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);
router.post('/:id/like', authMiddleware, likeRecipe);
router.post('/:id/dislike', authMiddleware, dislikeRecipe);

module.exports = router;