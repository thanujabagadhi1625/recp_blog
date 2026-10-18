const express = require('express');
const authMiddleware = require('../middleware/auth');
const { createAuthLimiter } = require('../middleware/rateLimiter');
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

const createUserRouter = (options = {}) => {
  const router = express.Router();
  const authLimiter = options.authLimiter || createAuthLimiter();

  router.post('/signup', authLimiter, validateSignup, userSignup);
  router.post('/login', authLimiter, validateLogin, userLogin);
  router.get('/search', authMiddleware, searchUsers);
  router.get('/me', authMiddleware, getMe);
  router.put('/me', authMiddleware, validateProfile, updateProfile);
  router.get('/:id', validateObjectId('id'), getUser);

  router.post('/favorites/:recipeId', authMiddleware, validateObjectId('recipeId'), addFavorite);
  router.delete('/favorites/:recipeId', authMiddleware, validateObjectId('recipeId'), removeFavorite);
  router.get('/me/favorites', authMiddleware, getFavorites);

  return router;
};

const defaultRouter = createUserRouter();
defaultRouter.createUserRouter = createUserRouter;

module.exports = defaultRouter;