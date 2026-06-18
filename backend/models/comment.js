const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    author: { type: String, required: true },
    text: { type: String, required: true },
    attachmentUrl: { type: String },
    attachmentType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
