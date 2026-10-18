const mongoose = require('mongoose');
const { MONGO_URL } = require('./env');

const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Mongoose connected');
  } catch (err) {
    const errorMsg = err?.message || String(err);
    console.error(
      'MongoDB connection failed. Check that your current IP is on the Atlas Network Access list and that the cluster is not paused.',
      errorMsg
    );
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDb;
