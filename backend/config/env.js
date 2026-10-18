const dotenv = require('dotenv');
dotenv.config();

const {
  JWT_SECRET,
  MONGO_URL,
  PORT,
  CLIENT_ORIGIN,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!JWT_SECRET) {
  throw new Error('Fatal error: JWT_SECRET environment variable is missing.');
}

if (!MONGO_URL) {
  throw new Error('Fatal error: MONGO_URL environment variable is missing.');
}

module.exports = {
  JWT_SECRET,
  MONGO_URL,
  PORT: PORT || 4444,
  CLIENT_ORIGIN: CLIENT_ORIGIN || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
};
