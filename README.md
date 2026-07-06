# �️ FoodieVerse - Full-Stack Recipe Sharing Platform

FoodieVerse is a full-stack MERN application where users can discover, share, and interact with recipes in a modern and responsive web experience. The platform supports recipe publishing, user profiles, favorites, comments, likes/dislikes, and real-time chat requests between users.

## ✨ Key Features

- **Secure Authentication:** User signup/login with JWT and bcrypt-based password hashing.
- **Recipe Management:** Users can create, view, edit, delete, and manage their own recipes.
- **Interactive Engagement:** Recipes support likes, dislikes, comments, and favorites.
- **User Profiles:** Users can update their profile, bio, favorite cuisines, and hobbies.
- **Search and Filtering:** Browse recipes with search and category-based filtering.
- **Image Uploads:** Recipe cover images and chat attachments are supported.
- **Real-Time Chat:** Users can send chat requests and communicate through real-time messaging with Socket.IO.

## 🛠️ Tech Stack

- **Frontend:** React, React Router, Axios, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, bcrypt
- **Real-Time Communication:** Socket.IO
- **Media Uploads:** Multer, Cloudinary-ready support

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/thanujabagadhi1625/recp_blog.git
cd recp_blog
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder with:
```env
MONGO_URL=mongodb://127.0.0.1:27017/recipedb
JWT_SECRET=your_secret_key
PORT=4444
```

Start the backend server:
```bash
npm start
```

### 3. Frontend setup
```bash
cd ../frontend/recp-app
npm install
npm run dev
```

The frontend will run locally, and the backend will be available at `http://localhost:4444`.

## 📌 Project Goals

This project was built to combine modern full-stack development practices with a practical, user-friendly recipe-sharing experience.

## 🤝 Contributing

Contributions are welcome. Feel free to open an issue or submit a pull request.
