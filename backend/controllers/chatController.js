const ChatRequest = require('../models/chatRequest');
const ChatMessage = require('../models/chatMessage');
const User = require('../models/user');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_URL) cloudinary.config({ url: process.env.CLOUDINARY_URL });

const sendChatRequest = async (req, res) => {
  try {
    const receiverId = req.params.receiverId;
    if (receiverId === req.userId) {
      return res.status(400).json({ message: 'Cannot send chat request to yourself.' });
    }

    const existing = await ChatRequest.findOne({ senderId: req.userId, receiverId });
    if (existing) {
      return res.status(400).json({ message: 'Chat request already sent.' });
    }

    const request = await ChatRequest.create({ senderId: req.userId, receiverId });
    return res.status(201).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating chat request' });
  }
};

const respondToChatRequest = async (req, res) => {
  try {
    const request = await ChatRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Chat request not found.' });
    if (request.receiverId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this request.' });
    }

    const action = req.body.action;
    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accepted or declined.' });
    }

    request.status = action;
    await request.save();
    return res.status(200).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error responding to chat request' });
  }
};

const getChatRequests = async (req, res) => {
  try {
    const requests = await ChatRequest.find({ receiverId: req.userId, status: 'pending' })
      .populate('senderId', 'name avatar favoriteCuisines hobbies');
    return res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching chat requests' });
  }
};

const getMessages = async (req, res) => {
  try {
    const chatRequest = await ChatRequest.findById(req.params.requestId);
    if (!chatRequest) return res.status(404).json({ message: 'Chat request not found.' });
    if (![chatRequest.senderId.toString(), chatRequest.receiverId.toString()].includes(req.userId)) {
      return res.status(403).json({ message: 'Not part of this chat.' });
    }
    if (chatRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Chat request is not accepted.' });
    }

    const messages = await ChatMessage.find({ chatRequestId: chatRequest._id }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const chatRequest = await ChatRequest.findById(req.params.requestId);
    if (!chatRequest) return res.status(404).json({ message: 'Chat request not found.' });
    if (![chatRequest.senderId.toString(), chatRequest.receiverId.toString()].includes(req.userId)) {
      return res.status(403).json({ message: 'Not part of this chat.' });
    }
    if (chatRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Chat request is not accepted.' });
    }

    const { text } = req.body;
    if (!text && !req.file) {
      return res.status(400).json({ message: 'Message text or attachment required.' });
    }

    const message = await ChatMessage.create({
      chatRequestId: chatRequest._id,
      senderId: req.userId,
      text: text ? text.trim() : undefined,
      attachmentUrl: req.file ? req.file.cloudinaryUrl : undefined,
      attachmentType: req.file ? req.file.mimetype : undefined,
    });

    // populate sender info for response
    const savedMessage = await ChatMessage.findById(message._id).populate('senderId', 'name avatar email');

    // Emit real-time message to room (room name = chatRequest id)
    const io = req.app.locals.io;
    if (io) {
      io.to(chatRequest._id.toString()).emit('new_message', savedMessage);
    }

    return res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error sending message' });
  }
};

const getChatRooms = async (req, res) => {
  try {
    const userId = req.userId;
    const rooms = await ChatRequest.find({
      status: 'accepted',
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).populate('senderId receiverId', 'name avatar email');

    const mapped = rooms.map(r => {
      const other = r.senderId._id.toString() === userId ? r.receiverId : r.senderId;
      return {
        chatRequestId: r._id,
        otherUser: {
          id: other._id,
          name: other.name,
          avatar: other.avatar,
          email: other.email,
        },
        createdAt: r.createdAt
      };
    });

    return res.status(200).json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error fetching chat rooms' });
  }
};

module.exports = {
  sendChatRequest,
  respondToChatRequest,
  getChatRequests,
  getMessages,
  sendMessage,
  getChatRooms,
};
