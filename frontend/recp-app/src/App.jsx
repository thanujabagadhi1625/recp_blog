// src/App.jsx
import React from "react";
import './App.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import axios from "axios";

// Import Layout, Pages, and Components
import MainNavigation from "./components/MainNavigation";
import Home from "./pages/Home";
import MyRecipes from "./pages/MyRecipes";
import AddRecipe from "./pages/AddRecipe";
import Favorites from "./pages/Favorites";
import RecipeDetail from "./pages/RecipeDetail";
import EditRecipe from "./pages/EditRecipe"; // I've created this new component for you
import NotFound from "./pages/NotFound"; // A good practice to have a 404 page
import Profile from "./pages/Profile";
import UserSearch from "./pages/UserSearch";
import ChatRequests from "./pages/ChatRequests";
import ChatRoom from "./pages/ChatRoom";

// Main router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainNavigation />,
    errorElement: <NotFound />,
    children: [
      {
        index: true, // This makes Home the default page for "/"
        element: <Home />,
        // Loader function to fetch initial recipes for the home page
        loader: async () => {
          try {
            const response = await axios.get("http://localhost:4444/api/recipes");
            return response.data;
          } catch (error) {
            console.error("Failed to load initial recipes:", error);
            return []; // Return empty array on error
          }
        },
      },
      { path: "/my-recipes", element: <MyRecipes /> },
      { path: "/favorites", element: <Favorites /> },
      { path: "/add-recipe", element: <AddRecipe /> },
      { path: "/recipe/:id", element: <RecipeDetail /> },
      { path: "/edit-recipe/:id", element: <EditRecipe /> }, // Route for the new edit page
      { path: "/profile", element: <Profile /> },
      { path: "/users", element: <UserSearch /> },
      { path: "/chat/requests", element: <ChatRequests /> },
      { path: "/chat/:requestId", element: <ChatRoom /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;