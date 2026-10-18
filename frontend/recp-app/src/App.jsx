// src/App.jsx
import React from "react";
import './App.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Import Layout, Pages, and Components
import MainNavigation from "./components/MainNavigation";
import Home from "./pages/Home";
import MyRecipes from "./pages/MyRecipes";
import AddRecipe from "./pages/AddRecipe";
import Favorites from "./pages/Favorites";
import RecipeDetail from "./pages/RecipeDetail";
import EditRecipe from "./pages/EditRecipe";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import UserSearch from "./pages/UserSearch";
import ChatRequests from "./pages/ChatRequests";
import ChatRoom from "./pages/ChatRoom";
import ChatRooms from "./pages/ChatRooms";

// Main router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainNavigation />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      { path: "/my-recipes", element: <MyRecipes /> },
      { path: "/favorites", element: <Favorites /> },
      { path: "/add-recipe", element: <AddRecipe /> },
      { path: "/recipe/:id", element: <RecipeDetail /> },
      { path: "/edit-recipe/:id", element: <EditRecipe /> }, // Route for the new edit page
      { path: "/profile", element: <Profile /> },
      { path: "/users", element: <UserSearch /> },
      { path: "/chat", element: <ChatRooms /> },
      { path: "/chat/requests", element: <ChatRequests /> },
      { path: "/chat/:requestId", element: <ChatRoom /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;