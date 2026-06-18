const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { 
  userSignup, 
  userLogin, 
  getUser, 
  addFavorite, 
  removeFavorite, 
  getFavorites,
  getMe,
  updateProfile,
  searchUsers
} = require('../controllers/userController');

router.post('/signup', userSignup);
router.post('/login', userLogin);
router.get('/search', authMiddleware, searchUsers);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateProfile);
router.get('/:id', getUser);

router.post('/favorites/:recipeId', authMiddleware, addFavorite);
router.delete('/favorites/:recipeId', authMiddleware, removeFavorite);
router.get('/me/favorites', authMiddleware, getFavorites);

module.exports = router;