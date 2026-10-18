const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const {
  validateSignup,
  validateLogin,
  validateProfile,
  validateObjectId,
} = require('../middleware/validation');
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/signup', authLimiter, validateSignup, userSignup);
router.post('/login', authLimiter, validateLogin, userLogin);
router.get('/search', authMiddleware, searchUsers);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, validateProfile, updateProfile);
router.get('/:id', validateObjectId('id'), getUser);

router.post('/favorites/:recipeId', authMiddleware, validateObjectId('recipeId'), addFavorite);
router.delete('/favorites/:recipeId', authMiddleware, validateObjectId('recipeId'), removeFavorite);
router.get('/me/favorites', authMiddleware, getFavorites);

module.exports = router;