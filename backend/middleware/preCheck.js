const mongoose = require('mongoose');
const Recipe = require('../models/recipe');
const ChatRequest = require('../models/chatRequest');

const verifyRecipeExists = async (req, res, next) => {
  const { recipeId } = req.params;
  if (!recipeId || !mongoose.isValidObjectId(recipeId)) {
    return res.status(400).json({ message: 'Invalid recipe ID format' });
  }
  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    req.recipe = recipe;
    next();
  } catch (err) {
    next(err);
  }
};

const verifyChatParticipant = async (req, res, next) => {
  const { requestId } = req.params;
  if (!requestId || !mongoose.isValidObjectId(requestId)) {
    return res.status(400).json({ message: 'Invalid chat request ID format' });
  }
  try {
    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({ message: 'Chat request not found' });
    }
    if (![chatRequest.senderId.toString(), chatRequest.receiverId.toString()].includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized for this chat' });
    }
    if (chatRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Chat request is not accepted' });
    }
    req.chatRequest = chatRequest;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyRecipeExists,
  verifyChatParticipant,
};
