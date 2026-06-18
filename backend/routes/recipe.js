const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
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

router.post('/', authMiddleware, upload.single('coverImage'), addRecipe);
router.put('/:id', authMiddleware, upload.single('coverImage'), editRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);
router.post('/:id/like', authMiddleware, likeRecipe);
router.post('/:id/dislike', authMiddleware, dislikeRecipe);

module.exports = router;