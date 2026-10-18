// src/components/navbar.jsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "./modal";
import Inputform from "./inputform";
import { AuthContext } from "../context/AuthContext";
import { FaUserAlt, FaSun, FaMoon } from "react-icons/fa";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // ignore
    }
    document.documentElement.dataset.theme = nextTheme;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2>🍴 FoodieVerse</h2>
        </Link>
        <ul>
          <li><Link to="/">Home</Link></li>
          {user && (
            <>
              <li><Link to="/favorites">Favorites</Link></li>
              <li><Link to="/my-recipes">My Recipes</Link></li>
              <li><Link to="/users">Find Users</Link></li>
              <li><Link to="/chat">Chats</Link></li>
              <li><Link to="/chat/requests">Chat Requests</Link></li>
              <li><Link to="/add-recipe">Add Recipe</Link></li>
            </>
          )}

          <li>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button>
          </li>
          
          {user ? (
            <li className="user-menu">
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          ) : (
            <li>
              <button type="button" onClick={() => setIsOpen(true)} className="login-btn">
                <FaUserAlt /> Login
              </button>
            </li>
          )}
        </ul>
      </header>

      {isOpen && !user && (
        <Modal onClose={() => setIsOpen(false)}>
          <Inputform setIsOpen={setIsOpen} />
        </Modal>
      )}
    </>
  );
}

export default Navbar;