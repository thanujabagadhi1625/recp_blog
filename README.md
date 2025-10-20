# 🍜 Recp - A Full-Stack MERN Recipe Application

This is a complete MERN stack (MongoDB, Express.js, React, Node.js) web application that allows users to publish, discover, and save their favorite recipes. It features a secure RESTful API with user authentication and a dynamic, user-friendly frontend.

## ✨ Key Features

- **Full User Authentication:** Secure user registration and login using JWT and bcrypt for password hashing.
- **Complete Recipe Management:** Users have full CRUD (Create, Read, Update, Delete) control over their own recipes.
- **Optional Image Uploads:** Users can optionally upload a cover image for their recipes using Multer for file handling.
- **Interactive UI:** Users can "like" recipes and add/remove recipes from their personal "favorites" list.
- **Dynamic Search & Filtering:** The homepage allows for real-time searching of all public recipes.

## 🛠️ Technology Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **File Storage:** Multer

## 🚀 How to Run Locally

1.  **Clone the Repository:** `git clone <your-repo-url>`
2.  **Start the Backend:**
    ```bash
    cd backend
    npm install
    # Create a .env file with your MONGO_URL and JWT_SECRET
    npm start
    ```
3.  **Start the Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```