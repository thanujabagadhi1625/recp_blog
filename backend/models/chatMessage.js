const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    chatRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRequest', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    attachmentUrl: { type: String },
    attachmentType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
