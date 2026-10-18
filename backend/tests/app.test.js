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
    it('returns 200 with status ok, uptime, and database connected', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.database).toBe('connected');
    });

    it('returns 503 with status degraded when database is not connected', async () => {
      await mongoose.disconnect();
      try {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('degraded');
        expect(res.body.database).toBe('disconnected');
        expect(typeof res.body.uptime).toBe('number');
      } finally {
        await mongoose.connect(mongoServer.getUri());
      }
    });
  });

  describe('Global Error Handling and Proxy', () => {
    it('returns 400 when malformed JSON is posted to /api/users/login', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken json');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid request payload|bad request/i);
    });

    it('enables trust proxy in createApp when trustProxy option is set', () => {
      const { createApp } = require('../server');
      const proxyApp = createApp({ trustProxy: true });
      expect(proxyApp.get('trust proxy')).toBeTruthy();

      const defaultApp = createApp();
      expect(defaultApp.get('trust proxy')).toBeFalsy();
    });
  });

  describe('Upload Ordering', () => {
    it('returns 404 for comment on nonexistent recipe without invoking Cloudinary upload', async () => {
      const cloudinary = require('cloudinary').v2;
      const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream');

      const userRes = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Upload Tester', email: 'uploadorder@example.com', password: 'password123' });
      const userToken = userRes.body.token;

      const nonExistentRecipeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/comments/recipe/${nonExistentRecipeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .field('text', 'Test comment on nonexistent recipe')
        .attach('attachment', Buffer.from('fake image content'), 'test.png');

      expect(res.status).toBe(404);
      expect(uploadSpy).not.toHaveBeenCalled();
      uploadSpy.mockRestore();
    });

    it('returns 400 and does not call cloudinary when MP4 bytes are sent as image/png with .png name to recipe cover route', async () => {
      const cloudinary = require('cloudinary').v2;
      const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream');

      const userRes = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Cover Tester', email: 'covertester@example.com', password: 'password123' });
      const userToken = userRes.body.token;

      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x6d, 0x70, 0x34, 0x32
      ]);

      const res = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Recipe with Fake Image')
        .field('description', 'Test description')
        .attach('coverImage', mp4Buffer, { filename: 'cover.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/file type mismatch/i);
      expect(uploadSpy).not.toHaveBeenCalled();
      uploadSpy.mockRestore();
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

    it('allows signup and login with dots and +tags in Gmail address without mismatch', async () => {
      const email = 'John.Doe+x@gmail.com';
      const signupRes = await request(app)
        .post('/api/users/signup')
        .send({
          name: 'John Doe',
          email,
          password: 'password123',
        });

      expect(signupRes.status).toBe(201);
      expect(signupRes.body).toHaveProperty('token');

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          email,
          password: 'password123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user.email).toBe(email.toLowerCase());
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

    it('registers two users with different emails and the same name; email login works, name login fails', async () => {
      const signup1 = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Sam Smith', email: 'sam1@example.com', password: 'password123' });
      expect(signup1.status).toBe(201);

      const signup2 = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Sam Smith', email: 'sam2@example.com', password: 'password123' });
      expect(signup2.status).toBe(201);

      const login1 = await request(app)
        .post('/api/users/login')
        .send({ email: 'sam1@example.com', password: 'password123' });
      expect(login1.status).toBe(200);
      expect(login1.body.user.email).toBe('sam1@example.com');

      const login2 = await request(app)
        .post('/api/users/login')
        .send({ email: 'sam2@example.com', password: 'password123' });
      expect(login2.status).toBe(200);
      expect(login2.body.user.email).toBe('sam2@example.com');

      const loginByName = await request(app)
        .post('/api/users/login')
        .send({ email: 'Sam Smith', password: 'password123' });
      expect(loginByName.status).toBeGreaterThanOrEqual(400);
      expect(loginByName.status).toBeLessThan(500);
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

    it('editRecipe rejects attempts to set userId, likes, viewCount, author', async () => {
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
          viewCount: 9999,
        });

      expect(res.status).toBe(200);
      const updated = await Recipe.findById(recipe._id);
      expect(updated.title).toBe('Whitelisted Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.userId.toString()).toBe(userAId.toString());
      expect(updated.author).toBe('User A');
      expect(updated.likes).toHaveLength(0);
      expect(updated.viewCount).toBe(0);
    });

    it('creates a recipe with prepTime "" and returns 201', async () => {
      const cloudinary = require('cloudinary').v2;
      const uploadSpy = jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options, cb) => {
        return {
          end: () => {
            cb(null, {
              secure_url: 'https://cloudinary.com/fake-cover.png',
              public_id: 'fake-cover-id',
            });
          },
        };
      });

      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .field('title', 'Blank PrepTime Recipe')
        .field('description', 'Delicious blank prep time recipe')
        .field('ingredients', 'Sugar, Spice')
        .field('instructions', 'Mix together')
        .field('prepTime', '')
        .attach('coverImage', pngBuffer, { filename: 'cover.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe('Blank PrepTime Recipe');
      expect(res.body.prepTime).toBe(0);

      uploadSpy.mockRestore();
    });
  });

  describe('User Profile and Favorites', () => {
    it('getMe returns 200 and populated favorites for a user who has at least one favorite', async () => {
      const userRes = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Fav User', email: 'favuser@example.com', password: 'password123' });
      const userToken = userRes.body.token;
      const userId = userRes.body.user.id;

      const recipe = await Recipe.create({
        title: 'Delicious Pasta',
        description: 'Cheesy and warm',
        ingredients: 'Pasta, Cheese',
        instructions: 'Boil pasta, add cheese',
        category: 'Dinner',
        cuisine: 'Italian',
        difficulty: 'Easy',
        author: 'Fav User',
        userId,
        coverImage: 'https://example.com/pasta.jpg',
      });

      const addFavRes = await request(app)
        .post(`/api/users/favorites/${recipe._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(addFavRes.status).toBe(200);

      const meRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(meRes.status).toBe(200);
      expect(Array.isArray(meRes.body.favorites)).toBe(true);
      expect(meRes.body.favorites.length).toBe(1);
      expect(meRes.body.favorites[0]).toMatchObject({
        title: 'Delicious Pasta',
      });
      expect(meRes.body.favorites[0]).toHaveProperty('coverImage');
    });

    it('updateProfile response contains id (not _id)', async () => {
      const userRes = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Profile User', email: 'profileuser@example.com', password: 'password123' });
      const userToken = userRes.body.token;
      const userId = userRes.body.user.id;

      const updateRes = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bio: 'Food enthusiast and amateur chef',
          favoriteCuisines: ['Italian', 'Mexican'],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body).toHaveProperty('id');
      expect(updateRes.body.id.toString()).toBe(userId.toString());
      expect(updateRes.body._id).toBeUndefined();
    });
  });

  describe('Like vs Favorite Independence', () => {
    let tokenUser;
    let userId;
    let recipe1;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Like Fav User', email: 'likefav@example.com', password: 'password123' });
      tokenUser = res.body.token;
      userId = res.body.user.id;

      recipe1 = await Recipe.create({
        title: 'Recipe 1',
        description: 'First recipe',
        ingredients: 'Salt',
        instructions: 'Cook',
        category: 'Dinner',
        cuisine: 'American',
        difficulty: 'Easy',
        author: 'Like Fav User',
        userId,
        coverImage: 'https://example.com/1.jpg',
      });

      await Recipe.create({
        title: 'Recipe 2',
        description: 'Second recipe',
        ingredients: 'Pepper',
        instructions: 'Bake',
        category: 'Lunch',
        cuisine: 'French',
        difficulty: 'Easy',
        author: 'Like Fav User',
        userId,
        coverImage: 'https://example.com/2.jpg',
      });
    });

    it('liking does not change favorites', async () => {
      const likeRes = await request(app)
        .post(`/api/recipes/${recipe1._id}/like`)
        .set('Authorization', `Bearer ${tokenUser}`);
      expect(likeRes.status).toBe(200);
      expect(likeRes.body.liked).toBe(true);
      expect(likeRes.body.likes).toBe(1);

      const user = await User.findById(userId);
      expect(user.favorites).toHaveLength(0);

      const updatedRecipe = await Recipe.findById(recipe1._id);
      expect(updatedRecipe.likes.map((id) => id.toString())).toContain(userId.toString());
    });

    it('adding a favorite does not change likes', async () => {
      const favRes = await request(app)
        .post(`/api/users/favorites/${recipe1._id}`)
        .set('Authorization', `Bearer ${tokenUser}`);
      expect(favRes.status).toBe(200);

      const user = await User.findById(userId);
      expect(user.favorites.map((id) => id.toString())).toContain(recipe1._id.toString());

      const recipe = await Recipe.findById(recipe1._id);
      expect(recipe.likes).toHaveLength(0);
    });

    it('GET /api/recipes/liked/me returns only liked recipes and never exposes emails', async () => {
      await request(app)
        .post(`/api/recipes/${recipe1._id}/like`)
        .set('Authorization', `Bearer ${tokenUser}`);

      const res = await request(app)
        .get('/api/recipes/liked/me')
        .set('Authorization', `Bearer ${tokenUser}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]._id.toString()).toBe(recipe1._id.toString());
      expect(res.body[0].title).toBe('Recipe 1');
      expect(res.body[0].userId).toBeDefined();
      expect(res.body[0].userId).toHaveProperty('name', 'Like Fav User');
      expect(res.body[0].userId).not.toHaveProperty('email');
    });
  });

  describe('Chat Request Lifecycle', () => {
    let senderToken;
    let senderId;
    let receiverToken;
    let receiverId;

    beforeEach(async () => {
      const resSender = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Sender User', email: 'chatsender@example.com', password: 'password123' });
      senderToken = resSender.body.token;
      senderId = resSender.body.user.id;

      const resReceiver = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Receiver User', email: 'chatreceiver@example.com', password: 'password123' });
      receiverToken = resReceiver.body.token;
      receiverId = resReceiver.body.user.id;
    });

    it('returns 409 when responding to a chat request that is not pending', async () => {
      const chatReq = await ChatRequest.create({
        senderId,
        receiverId,
        status: 'accepted',
      });

      const res = await request(app)
        .post(`/api/chats/request/${chatReq._id}/respond`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ action: 'declined' });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/only respond to pending|cannot respond/i);
    });

    it('allows a declined request to be re-sent, resulting in pending status', async () => {
      const sendRes = await request(app)
        .post(`/api/chats/request/${receiverId}`)
        .set('Authorization', `Bearer ${senderToken}`);
      expect(sendRes.status).toBe(201);
      const requestId = sendRes.body._id;

      const declineRes = await request(app)
        .post(`/api/chats/request/${requestId}/respond`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ action: 'declined' });
      expect(declineRes.status).toBe(200);

      const resendRes = await request(app)
        .post(`/api/chats/request/${receiverId}`)
        .set('Authorization', `Bearer ${senderToken}`);
      expect(resendRes.status).toBe(200);
      expect(resendRes.body.status).toBe('pending');

      const count = await ChatRequest.countDocuments({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });
      expect(count).toBe(1);
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
    let userAId;
    let userBId;
    let chatRequest;

    beforeEach(async () => {
      const resA = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Socket A', email: 'socket_a@example.com', password: 'password123' });
      tokenUserA = resA.body.token;
      userAId = resA.body.user.id;

      const resB = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Socket B', email: 'socket_b@example.com', password: 'password123' });
      tokenUserB = resB.body.token;
      userBId = resB.body.user.id;

      const resC = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Socket C', email: 'socket_c@example.com', password: 'password123' });
      tokenUserC = resC.body.token;

      chatRequest = await ChatRequest.create({
        senderId: userAId,
        receiverId: userBId,
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

    it('rejects socket join for participant of a pending request', async () => {
      const resPending = await request(app)
        .post('/api/users/signup')
        .send({ name: 'Pending Partner', email: 'pendingpartner@example.com', password: 'password123' });
      const pendingPartnerId = resPending.body.user.id;

      const pendingReq = await ChatRequest.create({
        senderId: userAId,
        receiverId: pendingPartnerId,
        status: 'pending',
      });

      await new Promise((resolve) => {
        const client = ioClient(`http://localhost:${serverPort}`, {
          transports: ['websocket'],
          auth: { token: tokenUserA },
          reconnection: false,
        });

        client.on('connect', () => {
          client.emit('join', pendingReq._id.toString());

          setTimeout(() => {
            const roomSockets = io.sockets.adapter.rooms.get(pendingReq._id.toString());
            const isInRoom = roomSockets ? roomSockets.has(client.id) : false;
            expect(isInRoom).toBe(false);
            client.close();
            resolve();
          }, 100);
        });
      });
    });
  });
});
