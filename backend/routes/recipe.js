const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getRecipes,
  getRecipe,
  addRecipe,
  editRecipe,
  deleteRecipe,
  likeRecipe,
  getUserRecipes
} = require('../controllers/recipeController');

router.get('/', getRecipes);
router.get('/:id', getRecipe);
router.get('/user/:userId', getUserRecipes);

router.post('/', authMiddleware, addRecipe);
router.put('/:id', authMiddleware, editRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);
router.post('/:id/like', authMiddleware, likeRecipe);

module.exports = router;