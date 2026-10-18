const dotenv = require('dotenv');
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

const {
  JWT_SECRET,
  MONGO_URL,
  PORT,
  CLIENT_ORIGIN,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!isTest && !JWT_SECRET) {
  throw new Error('Fatal error: JWT_SECRET environment variable is missing.');
}

if (!isTest && !MONGO_URL) {
  throw new Error('Fatal error: MONGO_URL environment variable is missing.');
}

module.exports = {
  JWT_SECRET: JWT_SECRET || (isTest ? 'test_jwt_secret_for_testing_12345678' : ''),
  MONGO_URL: MONGO_URL || (isTest ? 'mongodb://127.0.0.1:27017/test_db' : ''),
  PORT: PORT || 4444,
  CLIENT_ORIGIN: CLIENT_ORIGIN || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
};
