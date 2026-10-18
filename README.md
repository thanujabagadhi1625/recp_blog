# FoodieVerse - Full-Stack Recipe Sharing Platform

FoodieVerse is a full-stack MERN application (Express 5 + Mongoose on Node.js, React 19 + Vite on the frontend) designed for discovering, publishing, and interacting with culinary recipes, featuring real-time messaging, independent like/favorite systems, and a dual-theme dark/light interface.

---

## ✨ Features

- **Authentication & Profiles:** Secure email-and-password signup/login using bcrypt password hashing and JSON Web Tokens. Customizable user profiles with bio, favorite cuisines, and hobbies.
- **Recipe Management:** Create, view, edit, and delete recipes with categorization (Breakfast, Lunch, Dinner, Dessert, Snack, Beverage), cuisine tagging, and difficulty rating (Easy, Medium, Hard).
- **Search, Filter & Pagination:** Instant keyword search and multi-criteria filters with paginated recipe browsing (12 recipes per page).
- **Independent "Like" and "Favorite" System:** 
  - **Likes:** Public engagement counter on recipes (`likes` array on Recipe document), toggled via `POST /api/recipes/:id/like`. Publicly visible and affects recipe ranking without affecting personal bookmarks.
  - **Favorites:** Private personal bookmark collection on user documents (`User.favorites` array), managed via `POST /api/users/favorites/:id` and `DELETE /api/users/favorites/:id`.
  - **Independence Guarantee:** Liking/unliking a recipe never modifies a user's favorites; bookmarking/removing a favorite never alters a recipe's likes.
- **Dual Theme System (Dark Mode Default):**
  - **Default Theme:** Vampire Red / Dark Maroon (`:root`) with near-black `#0f0407` background, deep maroon `#1a0a0f` surfaces, and vampire red `#9b111e` accents.
  - **Secondary Theme:** Clean paper light aesthetic (`[data-theme="light"]`) with warm `#fbf3f2` background and crisp `#ffffff` surfaces.
  - **Zero-Flash Hydration:** Inline `<script>` in `<head>` sets `data-theme` synchronously before browser paint based on `localStorage.getItem('theme')`.
  - **Theme Toggle:** Sun/Moon toggle button in the navbar, accessible via keyboard and screen readers with dynamic `aria-label`.
- **Responsive Navigation:** Single-line desktop navigation bar that collapses gracefully below 900px into an accessible hamburger drawer with backdrop overlay, Escape-key dismiss, and auto-close on route transitions. Theme toggle and Logout stay visible at all viewport sizes.
- **Real-Time Direct Messaging:** 1-on-1 chat workflow via chat requests (send, accept, decline). Real-time communication powered by Socket.IO with JWT authentication and authorized room partitioning. Redesigned auto-growing composer with keyboard shortcuts (Enter to send, Shift+Enter for new line), inline attachment button, and styled bubble alignment.
- **Media Uploads:** Cloudinary-backed uploads for recipe cover images and chat attachments, verified with strict mime-type allowlists and magic-byte signature validation.
- **API Health Check:** Dedicated `/api/health` monitoring endpoint reporting server uptime.

---

## 🎨 Theme System & Color Palette

FoodieVerse implements a design-token CSS variable architecture defined in `src/styles/theme.css`:

| Token | Dark Mode (Default) | Light Mode | Usage |
|---|---|---|---|
| `--bg` | `#0f0407` | `#fbf3f2` | App background |
| `--surface` | `#1a0a0f` | `#ffffff` | Cards, modals, navbar background |
| `--surface-2` | `#261016` | `#f5e9e8` | Hover states, secondary panels, received chat bubbles |
| `--border` | `#3a1823` | `#e6d3d4` | Card, input, and divider borders |
| `--text` | `#f4e8ea` | `#2a1014` | Primary typography |
| `--text-muted` | `#b79aa0` | `#74575b` | Subtitles, timestamps, metadata |
| `--primary` | `#9b111e` | `#9b111e` | Primary buttons, sent chat bubbles |
| `--primary-hover` | `#b3202f` | `#b3202f` | Hover state for primary buttons |
| `--accent` | `#e63950` | `#e63950` | Active highlights, focus rings, links |
| `--danger` | `#ff5d6c` | `#d93848` | Delete buttons, error alerts |
| `--success` | `#3ecf8e` | `#198754` | Success banners, accept buttons |

Preference is stored in `localStorage` under the key `'theme'` (`'dark'` or `'light'`).

---

## 📸 Screenshots

<!-- Placeholders for production visual documentation -->
- **Dark Theme Home:** `![Dark Theme - Home Page](docs/screenshots/home-dark.png)`
- **Light Theme Home:** `![Light Theme - Home Page](docs/screenshots/home-light.png)`
- **Recipe Detail & Reviews:** `![Recipe Detail & Reviews](docs/screenshots/recipe-detail.png)`
- **Favorites Page (Saved vs Liked Tabs):** `![Favorites - Saved vs Liked Tabs](docs/screenshots/favorites-tabs.png)`
- **Mobile Responsive Navigation:** `![Responsive Mobile Navigation](docs/screenshots/mobile-nav.png)`
- **Real-Time Chat & Composer:** `![Real-Time Chat & Composer](docs/screenshots/chat-room.png)`

---

## ⚙️ Environment Variables

### Backend (`/backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URL` | Yes | - | MongoDB connection URI (e.g. Atlas cluster or local instance) |
| `JWT_SECRET` | Yes | - | Secret key used for signing and verifying JWT tokens |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated list of allowed frontend origins for CORS and Socket.IO |
| `PORT` | No | `4444` | Port number on which the Express server listens |
| `TRUST_PROXY` | No | `false` | Enable Express `trust proxy` setting (set to `1` or `true` when behind reverse proxy) |
| `CLOUDINARY_CLOUD_NAME` | Yes | - | Cloudinary cloud name for media storage |
| `CLOUDINARY_API_KEY` | Yes | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | - | Cloudinary API secret |

### Frontend (`/frontend/recp-app/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:4444` | Base URL of the backend REST API and Socket.IO server |

---

## 📡 API Reference: Liked Recipes Endpoint

### `GET /api/recipes/liked/me`

Retrieves all recipes that the currently authenticated user has liked. Registered before the parameterized `GET /api/recipes/:id` route to avoid route collisions.

#### Request Headers
```http
GET /api/recipes/liked/me HTTP/1.1
Host: localhost:4444
Authorization: Bearer <valid_jwt_token>
```

#### Query Parameters
None required.

#### Response Status Codes
- `200 OK`: Returns an array of recipe objects.
- `401 Unauthorized`: Missing or invalid JWT token.

#### Sample `200 OK` Response
```json
[
  {
    "_id": "67123abc456def7890123456",
    "title": "Creamy Tuscan Garlic Chicken",
    "description": "Rich chicken dinner with sun-dried tomatoes and spinach.",
    "category": "Dinner",
    "cuisine": "Italian",
    "difficulty": "Medium",
    "prepTime": 15,
    "cookTime": 25,
    "servings": 4,
    "coverImage": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    "likes": [
      "67123user1",
      "67123currentuser"
    ],
    "dislikes": [],
    "viewCount": 54,
    "userId": {
      "_id": "67123user1",
      "name": "Chef Mario",
      "avatar": "https://res.cloudinary.com/demo/image/upload/avatar.jpg"
    },
    "createdAt": "2026-10-18T10:00:00.000Z",
    "updatedAt": "2026-10-18T12:00:00.000Z"
  }
]
```
*(Author email addresses are strictly omitted from the response to preserve user privacy.)*

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

- **Independent Like & Favorite Architecture:** Liking and bookmarking serve fundamentally different user intents. Likes are public metrics stored on the recipe; favorites are private bookmarks stored on the user profile. They do not cross-mutate.
- **JWT in LocalStorage & Synchronous Hydration:** Tokens are stored in browser `localStorage` for seamless Single Page Application (SPA) state hydration and persistent authorization across tabs and socket handshakes. Auth state is initialized lazily and synchronously to prevent 401 logout cascades on page reloads. Email addresses are strictly scrubbed from all public API endpoints and database projections.
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
- Like vs Favorite independence (liking doesn't change favorites, favoriting doesn't change likes)
- `GET /api/recipes/liked/me` route verification and email privacy
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
