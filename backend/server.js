// backend/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDb = require('./config/connectionDb');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

connectDb();

// prefix APIs with /api
app.use('/api/recipes', require('./routes/recipe'));
app.use('/api/comments', require('./routes/comment'));
app.use('/api/chats', require('./routes/chat'));
app.use('/api/users', require('./routes/user'));

const PORT = process.env.PORT || 4444;

// Create HTTP server and attach Socket.IO for real-time chat
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Expose io via app.locals so controllers can emit events
app.locals.io = io;

io.on('connection', (socket) => {
  socket.on('join', (room) => {
    if (room) socket.join(room);
  });
  socket.on('leave', (room) => {
    if (room) socket.leave(room);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
