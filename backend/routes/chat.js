const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadAttachment, uploadToCloudinary } = require('../middleware/upload');
const { verifyChatParticipant } = require('../middleware/preCheck');
const { validateChatMessage, validateObjectId } = require('../middleware/validation');
const {
  sendChatRequest,
  respondToChatRequest,
  getChatRequests,
  getMessages,
  sendMessage,
  getChatRooms,
} = require('../controllers/chatController');

router.post('/request/:receiverId', authMiddleware, validateObjectId('receiverId'), sendChatRequest);
router.get('/requests', authMiddleware, getChatRequests);
router.get('/rooms', authMiddleware, getChatRooms);
router.post('/request/:requestId/respond', authMiddleware, validateObjectId('requestId'), respondToChatRequest);
router.get('/:requestId/messages', authMiddleware, validateObjectId('requestId'), getMessages);

router.post(
  '/:requestId/messages',
  authMiddleware,
  validateObjectId('requestId'),
  verifyChatParticipant,
  uploadAttachment.single('attachment'),
  validateChatMessage,
  uploadToCloudinary,
  sendMessage
);

module.exports = router;
