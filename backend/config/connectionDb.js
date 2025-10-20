// backend/config/connectionDb.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDb = async () => {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/recipedb';
    await mongoose.connect(MONGO_URL);
    console.log('✅ Mongoose connected');
  } catch (err) {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDb;
