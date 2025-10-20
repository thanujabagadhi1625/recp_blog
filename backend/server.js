// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDb = require('./config/connectionDb');
require('dotenv').config();


const app = express();
app.use(express.json());
app.use(cors());

connectDb();

// prefix APIs with /api
app.use('/api/recipes', require('./routes/recipe'));
app.use('/api/users', require('./routes/user'));

const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
