const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  sendChatRequest,
  respondToChatRequest,
  getChatRequests,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

router.post('/request/:receiverId', authMiddleware, sendChatRequest);
router.get('/requests', authMiddleware, getChatRequests);
router.post('/request/:requestId/respond', authMiddleware, respondToChatRequest);
router.get('/:requestId/messages', authMiddleware, getMessages);
router.post('/:requestId/messages', authMiddleware, upload.single('attachment'), sendMessage);

module.exports = router;
