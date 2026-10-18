const mongoose = require('mongoose');
const { MONGO_URL } = require('./env');

const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Mongoose connected');
  } catch (err) {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDb;
