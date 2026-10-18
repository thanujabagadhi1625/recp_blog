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

const missing = [];
if (!JWT_SECRET) missing.push('JWT_SECRET');
if (!MONGO_URL) missing.push('MONGO_URL');
if (!CLIENT_ORIGIN) missing.push('CLIENT_ORIGIN');
if (!CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

if (missing.length > 0) {
  throw new Error(`Fatal error: Missing required environment variable(s): ${missing.join(', ')}`);
}

module.exports = {
  JWT_SECRET,
  MONGO_URL,
  PORT: PORT ? parseInt(PORT, 10) : 4444,
  CLIENT_ORIGIN,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  TRUST_PROXY: process.env.TRUST_PROXY,
};
