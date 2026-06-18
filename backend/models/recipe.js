const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    ingredients: { type: String, required: true },
    instructions: { type: String, required: true },
    
    category: { 
      type: String, 
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage'],
      default: 'Dinner'
    },
    cuisine: { type: String, default: 'International' },
    difficulty: { 
      type: String, 
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    prepTime: { type: Number, default: 0 },
    cookTime: { type: Number, default: 0 },
    servings: { type: Number, default: 4 },
    coverImage: { type: String, default: 'https://via.placeholder.com/400x300?text=Recipe' },
    tags: [{ type: String }],
    
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: { type: String, required: true },
    
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recipeSchema.index({ title: 'text', ingredients: 'text', description: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);