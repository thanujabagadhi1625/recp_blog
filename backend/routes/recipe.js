const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadRecipeCover, uploadToCloudinary } = require('../middleware/upload');
const {
  validateRecipeCreate,
  validateRecipeEdit,
  validateObjectId,
} = require('../middleware/validation');
const {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  likeRecipe,
  dislikeRecipe,
  getUserRecipes,
} = require('../controllers/recipeController');

router.get('/', getRecipes);
router.get('/user/:userId', validateObjectId('userId'), getUserRecipes);
router.get('/:id', validateObjectId('id'), getRecipe);

router.post(
  '/',
  authMiddleware,
  uploadRecipeCover.single('coverImage'),
  validateRecipeCreate,
  uploadToCloudinary,
  addRecipe
);

router.put(
  '/:id',
  authMiddleware,
  validateObjectId('id'),
  uploadRecipeCover.single('coverImage'),
  validateRecipeEdit,
  uploadToCloudinary,
  editRecipe
);

router.delete('/:id', authMiddleware, validateObjectId('id'), deleteRecipe);
router.post('/:id/like', authMiddleware, validateObjectId('id'), likeRecipe);
router.post('/:id/dislike', authMiddleware, validateObjectId('id'), dislikeRecipe);

module.exports = router;