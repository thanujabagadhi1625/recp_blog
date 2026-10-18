const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { JWT_SECRET, PORT, CLIENT_ORIGIN } = require('./config/env');
const connectDb = require('./config/connectionDb');
const ChatRequest = require('./models/chatRequest');
const { createLimiter, createAuthLimiter } = require('./middleware/rateLimiter');
const { createUserRouter } = require('./routes/user');

const clientOrigins = CLIENT_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function createApp(options = {}) {
  const app = express();

  const trustProxy = options.trustProxy !== undefined
    ? options.trustProxy
    : (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true');

  if (trustProxy) {
    app.set('trust proxy', 1);
  }

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  const generalLimiter = options.generalLimiter || createLimiter(
    options.generalLimit ? { max: options.generalLimit, skip: () => false } : undefined
  );
  app.use('/api', generalLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Prefix APIs with /api
  app.use('/api/recipes', require('./routes/recipe'));
  app.use('/api/comments', require('./routes/comment'));
  app.use('/api/chats', require('./routes/chat'));

  const userRouter = options.authLimit
    ? createUserRouter({ authLimiter: createAuthLimiter({ max: options.authLimit, skip: () => false }) })
    : (options.userRouter || require('./routes/user'));
  app.use('/api/users', userRouter);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled application error:', err);

    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ message: 'Not allowed by CORS' });
    }

    if (err.name === 'MulterError') {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }

    if (err.message && (err.message.includes('file type') || err.message.includes('Unsupported file') || err.message.includes('file mismatch'))) {
      return res.status(400).json({ message: err.message });
    }

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate key error' });
    }

    const status = err.status || err.statusCode;
    if (status && status >= 400 && status < 500) {
      const genericMessage = status === 413 ? 'Payload too large' : 'Invalid request payload';
      return res.status(status).json({ message: genericMessage });
    }

    return res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
}

const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  connectDb();
}

// Create HTTP server and attach Socket.IO for real-time chat
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    credentials: true,
  },
});

app.locals.io = io;

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join', async (room) => {
    if (!room || !mongoose.isValidObjectId(room)) return;
    try {
      const chatRequest = await ChatRequest.findById(room);
      if (
        chatRequest &&
        chatRequest.status === 'accepted' &&
        [chatRequest.senderId.toString(), chatRequest.receiverId.toString()].includes(socket.userId)
      ) {
        socket.join(room);
      }
    } catch (err) {
      console.error('Socket join error:', err);
    }
  });

  socket.on('leave', (room) => {
    if (room) socket.leave(room);
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = { app, server, io, createApp };
