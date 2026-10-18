# FoodieVerse - Full-Stack Recipe Sharing Platform

FoodieVerse is a full-stack MERN application (Express 5 + Mongoose on Node.js, React 19 + Vite on the frontend) designed for discovering, publishing, and interacting with culinary recipes, featuring real-time messaging and community engagement.

---

## ✨ Features

- **Authentication & Profiles:** Secure email-and-password signup/login using bcrypt password hashing and JSON Web Tokens. Customizable user profiles with bio, favorite cuisines, and hobbies.
- **Recipe Management:** Create, view, edit, and delete recipes with categorization (Breakfast, Lunch, Dinner, Dessert, Snack, Beverage), cuisine tagging, and difficulty rating (Easy, Medium, Hard).
- **Search, Filter & Pagination:** Instant keyword search and multi-criteria filters with paginated recipe browsing (12 recipes per page).
- **Social Engagement:** Atomic like and dislike toggling, view count tracking with edit inflation protection, personal favorites collection, and threaded discussion comments capped at the latest 100 entries.
- **Real-Time Direct Messaging:** 1-on-1 chat workflow via chat requests (send, accept, decline). Real-time communication powered by Socket.IO with JWT authentication and authorized room partitioning.
- **Media Uploads:** Cloudinary-backed uploads for recipe cover images and chat attachments, verified with strict mime-type allowlists and magic-byte signature validation.
- **Accessibility:** Accessible modal dialogs with Escape-key dismiss, semantic navbar buttons, and accessible password visibility toggles.
- **API Health Check:** Dedicated `/api/health` monitoring endpoint reporting server uptime.

---

## ⚙️ Environment Variables

### Backend (`/backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URL` | Yes | - | MongoDB connection URI (e.g. Atlas or local instance) |
| `JWT_SECRET` | Yes | - | Secret key used for signing and verifying JWT tokens |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated list of allowed frontend origins for CORS and Socket.IO |
| `PORT` | No | `4444` | Port number on which the Express server listens |
| `CLOUDINARY_CLOUD_NAME` | Yes | - | Cloudinary cloud name for media storage |
| `CLOUDINARY_API_KEY` | Yes | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | - | Cloudinary API secret |

### Frontend (`/frontend/recp-app/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:4444` | Base URL of the backend REST API and Socket.IO server |

---

## 🚀 Setup & Installation

### 1. Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB instance (local or MongoDB Atlas)
- Cloudinary account for media storage

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and supply your MONGO_URL, JWT_SECRET, and Cloudinary credentials
npm run dev
```

The backend server starts by default on `http://localhost:4444`.

### 3. Frontend Setup

```bash
cd frontend/recp-app
npm install
cp .env.example .env
npm run dev
```

The Vite dev server will launch at `http://localhost:5173`.

---

## 🔒 Security & Design Decisions

- **JWT in LocalStorage Trade-off:** Tokens are stored in browser `localStorage` for seamless Single Page Application (SPA) state hydration and persistent authorization across tabs and socket handshakes. To mitigate potential exposure, email addresses are strictly scrubbed from all public API endpoints and database projections.
- **Rate Limiting:** Protects against credential-stuffing and denial-of-service. Sensitive auth endpoints (`/login`, `/signup`) are strictly throttled to 10 requests per 15 minutes per IP, while general `/api` routes are throttled to 300 requests per 15 minutes.
- **Upload Validation & Ordering:** Cover images and chat attachments are limited to explicit file extensions and mime types with magic-byte buffer validation (`file-type`). Authorization and resource existence checks run *prior* to file processing to prevent unauthorized Cloudinary uploads.
- **Socket Authentication & Room Isolation:** Sockets must provide a valid JWT in the handshake authentication packet. Joining a chat room requires an accepted `ChatRequest` where the connecting user is an explicit participant (sender or receiver).
- **Edit Whitelist:** Recipe updates strictly whitelist mutable fields (`title`, `description`, `ingredients`, `instructions`, `category`, `cuisine`, `difficulty`, `prepTime`, `cookTime`, `servings`, `tags`, `coverImage`), preventing tampering with authorship, likes, or user associations.

---

## 🧪 Running Tests

The backend includes an automated test suite powered by Jest, Supertest, and `mongodb-memory-server`:

```bash
cd backend
npm test
```

The test suite covers:
- `/api/health` status check
- User signup and login happy paths, duplicate email rejection (409), and generic invalid credential failures (401)
- Recipe edit and delete authorization (403 for non-owners)
- Recipe edit whitelist enforcement (ignoring `userId`, `author`, `likes`)
- Chat participant authorization (403 for non-participants on GET and POST)
- Email privacy protection on all public endpoints (`/api/recipes`, `/api/recipes/:id`, `/api/users/:id`, `/api/users/search`)
- Socket.IO connection authentication and unauthorized room join rejection

To run frontend linting and production build verification:

```bash
cd frontend/recp-app
npm run lint
npm run build
```

---

## ⚠️ Known Limitations

- **Email Uniqueness on Signup:** Email addresses must be unique; social login (OAuth/Google) is not yet integrated.
- **In-Memory Rate Limiting:** Rate limit counters are tracked in process memory and reset upon server restart; for distributed production clusters, a Redis-backed store should be used.
- **Real-Time Group Chats:** Real-time messaging is currently limited to 1-on-1 conversations between accepted request pairs.
- **File Upload Limits:** Recipe cover images are capped at 5 MB (images only); chat attachments are capped at 10 MB (images and videos).
