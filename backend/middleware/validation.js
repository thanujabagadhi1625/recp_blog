const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Comment = require('../models/comment');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage('Name must be between 2 and 40 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters'),
  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

const validateRecipeCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('prepTime')
    .optional()
    .toInt()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Prep time must be between 0 and 1440 minutes'),
  body('cookTime')
    .optional()
    .toInt()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Cook time must be between 0 and 1440 minutes'),
  body('servings')
    .optional()
    .toInt()
    .isInt({ min: 1, max: 500 })
    .withMessage('Servings must be between 1 and 500'),
  body('category')
    .optional()
    .isIn(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Invalid difficulty'),
  handleValidationErrors,
];

const validateRecipeEdit = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Title cannot exceed 120 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('prepTime')
    .optional()
    .toInt()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Prep time must be between 0 and 1440 minutes'),
  body('cookTime')
    .optional()
    .toInt()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Cook time must be between 0 and 1440 minutes'),
  body('servings')
    .optional()
    .toInt()
    .isInt({ min: 1, max: 500 })
    .withMessage('Servings must be between 1 and 500'),
  body('category')
    .optional()
    .isIn(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Invalid difficulty'),
  handleValidationErrors,
];

const validateComment = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment text must be between 1 and 1000 characters'),
  body('parentId')
    .optional({ checkFalsy: true })
    .custom(async (value, { req }) => {
      if (!mongoose.isValidObjectId(value)) {
        throw new Error('Invalid parentId format');
      }
      const parent = await Comment.findById(value);
      if (!parent) {
        throw new Error('Parent comment not found');
      }
      if (parent.recipeId.toString() !== req.params.recipeId) {
        throw new Error('Parent comment does not belong to this recipe');
      }
      return true;
    }),
  handleValidationErrors,
];

const validateChatMessage = [
  body('text')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Message text cannot exceed 2000 characters'),
  handleValidationErrors,
];

const validateProfile = [
  body('avatar')
    .optional({ values: 'undefined' })
    .custom((value) => {
      if (value === '' || value === null) {
        return true;
      }
      if (typeof value !== 'string') {
        throw new Error('Avatar must be an https URL or empty string');
      }
      const trimmed = value.trim();
      if (trimmed === '') {
        return true;
      }
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'https:') {
          return true;
        }
      } catch (e) {
        // invalid URL
      }
      throw new Error('Avatar must be an https URL or empty string');
    }),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Bio cannot exceed 200 characters'),
  handleValidationErrors,
];

const validateObjectId = (paramName) => [
  param(paramName).custom((value) => {
    if (!mongoose.isValidObjectId(value)) {
      throw new Error(`Invalid ${paramName}`);
    }
    return true;
  }),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateSignup,
  validateLogin,
  validateRecipeCreate,
  validateRecipeEdit,
  validateComment,
  validateChatMessage,
  validateProfile,
  validateObjectId,
};
