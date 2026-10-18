const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ioClient = require('socket.io-client');

const User = require('../models/user');
const Recipe = require('../models/recipe');
const ChatRequest = require('../models/chatRequest');
const ChatMessage = require('../models/chatMessage');

describe('Backend Test Suite', () => {
  let mongoServer;
  let serverInstance;
  let serverPort;
  let app;
  let server;
  let io;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    await mongoose.connect(mongoServer.getUri());

    const serverModule = require('../server');
    app = serverModule.app;
    server = serverModule.server;
    io = serverModule.io;

    await new Promise((resolve) => {
      serverInstance = server.listen(0, () => {
        serverPort = serverInstance.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (io) {
      io.close();
    }
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Recipe.deleteMany({});
    await ChatRequest.deleteMany({});
    await ChatMessage.deleteMany({});
  });

  describe('Health Endpoint', () => {
    it('returns 200 with status ok and uptime', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('Rate Limiting', () => {
    it('returns 429 on the 4th login attempt when auth limit is configured to 3', async () => {
      const { createApp } = require('../server');
      const limitedApp = createApp({ authLimit: 3 });

      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Rate Limit User',
        email: 'ratelimit@example.com',
        password: hashedPassword,
      });

      const res1 = await request(limitedApp)
        .post('/api/users/login')
        .send({ email: 'ratelimit@example.com', password: 'password123' });
      expect(res1.status).toBe(200);

      const res2 = await request(limitedApp)
        .post('/api/users/login')
        .send({ email: 'ratelimit@example.com', password: 'password123' });
      expect(res2.status).toBe(200);

      const res3 = await request(limitedApp)
        .post('/api/users/login')
        .send({ email: 'ratelimit@example.com', password: 'password123' });
      expect(res3.status).toBe(200);

      const res4 = await request(limitedApp)
        .post('/api/users/login')
        .send({ email: 'ratelimit@example.com', password: 'password123' });
      expect(res4.status).toBe(429);
    });
  });

  describe('Auth: Signup and Login', () => {
    it('allows a user to signup and then login', async () => {
      const signupRes = await request(app)
        .post('/api/users/signup')
        .send({
          name: 'Alice Tester',
          email: 'alice@example.com',
          password: 'password123',
        });

      expect(signupRes.status).toBe(201);
      expect(signupRes.body).toHaveProperty('token');
      expect(signupRes.body.user).toMatchObject({
        name: 'Alice Tester',
        email: 'alice@example.com',
      });
      expect(signupRes.body.user).toHaveProperty('id');

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          email: 'alice@example.com',
          password: 'password123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user.email).toBe('alice@example.com');
    });

    it('returns generic 401 for unknown email or incorrect password', async () => {
      await request(app)
        .post('/api/users/signup')
        .send({
          name: 'Bob Tester',
          email: 'bob@example.com',
          password: 'password123',
        });

      const wrongPassRes = await request(app)
        .post('/api/users/login')
        .send({
          email: 'bob@example.com',
          password: 'wrongpassword',
        });
      expect(wrongPassRes.status).toBe(401);
      expect(wrongPassRes.body.message).toBe('Invalid credentials');

      const unknownUserRes = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nobody@example.com',
          password: 'password123',
        });
      expect(unknownUserRes.status).toBe(401);
      expect(unknownUserRes.body.message).toBe('Invalid credentials');
    });

    it('returns 409 when signing up with an already registered email', async () => {
      await request(app)
        .post('/api/users/signup')
        .send({
          name: 'Duplicate Tester',
          email: 'dup@example.com',
          password: 'password123',
        });

      const dupRes = await request(app)
        .post('/api/users/signup')
        .send({
          name: 'Duplicate Tester 2',
          email: 'dup@example.com',
          password: 'password123',
        });
      expect(dupRes.status).toBe(409);
    });
  });

  describe('Recipe Authorization and Edit Whitelist', () => {
    let tokenUserA;
    let tokenUserB;
    let userAId;
    let recipe;

    beforeEach(async () => {
      const resA = await request(app)
        .post('/api/users/signup')
        .send({ name: 'User A', email: 'usera@example.com', password: 'password123' });
      tokenUserA = resA.body.token;
      userAId = resA.body.user.id;

      const resB = await request(app)
        .post('/api/users/signup')
        .send({ name: 'User B', email: 'userb@example.com', password: 'password123' });
      tokenUserB = resB.body.token;

      recipe = await Recipe.create({
        title: 'Original Title',
        description: 'Original description',
        ingredients: 'Salt, Pepper',
        instructions: 'Mix well',
        category: 'Dinner',
        cuisine: 'Italian',
        difficulty: 'Easy',
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        author: 'User A',
        userId: userAId,
        coverImage: 'https://example.com/cover.jpg',
      });
    });

    it('returns 403 when user B tries to edit user A recipe', async () => {
      const res = await request(app)
        .put(`/api/recipes/${recipe._id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('returns 403 when user B tries to delete user A recipe', async () => {
      const res = await request(app)
        .delete(`/api/recipes/${recipe._id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('enforces whitelist on edit and does not allow modifying userId, likes, or author', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/recipes/${recipe._id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'Whitelisted Title',
          description: 'Updated description',
          userId: fakeUserId.toString(),
          author: 'Malicious Author',
          likes: [fakeUserId.toString()],
        });

      expect(res.status).toBe(200);
      const updated = await Recipe.findById(recipe._id);
      expect(updated.title).toBe('Whitelisted Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.userId.toString()).toBe(userAId.toString());
      expect(updated.author).toBe('User A');
      expect(updated.likes).toHaveLength(0);
    });
  });

  describe('Chat: Non-participant Protection', () => {
    let tokenUserA;
    let tokenUserB;
    let tokenUserC;
    let chatRequest;

    beforeEach(async () => {
      const resA = await request(app)
        .post('/api/users/signup')
        .send({ name: 'User A', email: 'chat_a@example.com', password: 'password123' });
      tokenUserA = resA.body.token;

      const resB = await request(app)
        .post('/api/users/signup')
        .send({ name: 'User B', email: 'chat_b@example.com', password: 'password123' });
      tokenUserB = resB.body.token;

      const resC = await request(app)
        .post('/api/users/signup')
        .send({ name: 'User C', email: 'chat_c@example.com', password: 'password123' });
      tokenUserC = resC.body.token;

      chatRequest = await ChatRequest.create({
        senderId: resA.body.user.id,
        receiverId: resB.body.user.id,
        status: 'accepted',
      });
    });

    it('returns 403 when non-participant User C tries to fetch or send messages in the chat', async () => {
      const getRes = await request(app)
        .get(`/api/chats/${chatRequest._id}/messages`)
        .set('Authorization', `Bearer ${tokenUserC}`);

      expect(getRes.status).toBe(403);
      expect(getRes.body.message).toMatch(/not part of this chat/i);

      const sendRes = await request(app)
        .post(`/api/chats/${chatRequest._id}/messages`)
        .set('Authorization', `Bearer ${tokenUserC}`)
        .send({ text: 'Unauthorized message' });

      expect(sendRes.status).toBe(403);
      expect(sendRes.body.message).toMatch(/not authorized for this chat|not part of this chat/i);
    });
  });

  describe('Privacy: Never Expose Emails on Public Endpoints', () => {
    let createdRecipe;
    let userAId;

    beforeEach(async () => {
      const resA = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Alice Private', email: 'private_alice@example.com', password: 'password123' });
      userAId = resA.body.user.id;

      createdRecipe = await Recipe.create({
        title: 'Secret Recipe',
        description: 'No email exposed here',
        ingredients: 'Sugar, spice',
        instructions: 'Mix and bake',
        category: 'Dessert',
        cuisine: 'American',
        difficulty: 'Easy',
        author: 'Alice Private',
        userId: userAId,
        coverImage: 'https://example.com/cake.jpg',
      });
    });

    it('does not include author email in GET /api/recipes listing', async () => {
      const res = await request(app).get('/api/recipes');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      res.body.items.forEach((item) => {
        if (item.userId) {
          expect(item.userId).not.toHaveProperty('email');
        }
      });
    });

    it('does not include author email in GET /api/recipes/:id', async () => {
      const res = await request(app).get(`/api/recipes/${createdRecipe._id}`);
      expect(res.status).toBe(200);
      expect(res.body.userId).not.toHaveProperty('email');
    });

    it('does not include email in public GET /api/users/:id', async () => {
      const res = await request(app).get(`/api/users/${userAId}`);
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('email');
      expect(res.body).toHaveProperty('name', 'Alice Private');
    });

    it('does not include email in GET /api/users/search', async () => {
      const userRes = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Searcher', email: 'searcher@example.com', password: 'password123' });

      const res = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Authorization', `Bearer ${userRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((u) => {
        expect(u).not.toHaveProperty('email');
      });
    });
  });

  describe('Socket.IO Room Authorization', () => {
    let tokenUserA;
    let tokenUserB;
    let tokenUserC;
    let chatRequest;

    beforeEach(async () => {
      const resA = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Socket A', email: 'socket_a@example.com', password: 'password123' });
      tokenUserA = resA.body.token;

      const resB = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Socket B', email: 'socket_b@example.com', password: 'password123' });
      tokenUserB = resB.body.token;

      const resC = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Socket C', email: 'socket_c@example.com', password: 'password123' });
      tokenUserC = resC.body.token;

      chatRequest = await ChatRequest.create({
        senderId: resA.body.user.id,
        receiverId: resB.body.user.id,
        status: 'accepted',
      });
    });

    it('rejects socket connection without token', (done) => {
      const client = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        reconnection: false,
      });

      client.on('connect_error', (err) => {
        expect(err.message).toMatch(/No token provided/i);
        client.close();
        done();
      });
    });

    it('allows participant to join chat room and rejects non-participant from joining', (done) => {
      const clientParticipant = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: tokenUserA },
        reconnection: false,
      });

      clientParticipant.on('connect', () => {
        clientParticipant.emit('join', chatRequest._id.toString());

        setTimeout(() => {
          const roomSockets = io.sockets.adapter.rooms.get(chatRequest._id.toString());
          expect(roomSockets).toBeDefined();
          expect(roomSockets.has(clientParticipant.id)).toBe(true);

          // Now test non-participant
          const clientNonParticipant = ioClient(`http://localhost:${serverPort}`, {
            transports: ['websocket'],
            auth: { token: tokenUserC },
            reconnection: false,
          });

          clientNonParticipant.on('connect', () => {
            clientNonParticipant.emit('join', chatRequest._id.toString());

            setTimeout(() => {
              const currentRoomSockets = io.sockets.adapter.rooms.get(chatRequest._id.toString());
              expect(currentRoomSockets.has(clientNonParticipant.id)).toBe(false);

              clientParticipant.close();
              clientNonParticipant.close();
              done();
            }, 100);
          });
        }, 100);
      });
    });
  });
});
