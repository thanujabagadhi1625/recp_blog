// src/components/navbar.jsx
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Modal from "./modal";
import Inputform from "./inputform";
import { AuthContext } from "../context/AuthContext";
import { FaUserAlt, FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "dark";
    } catch {
      return "dark";
    }
  });
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

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
      <header className="navbar-header">
        <div className="navbar-brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2>🍴 FoodieVerse</h2>
          </Link>
        </div>

        {/* Collapsible nav links (drawer on <900px, inline row on >=900px) */}
        <nav
          id="navbar-nav-links"
          className={`navbar-links ${menuOpen ? "open" : ""}`}
          aria-label="Main Navigation"
        >
          <ul className="nav-links-list">
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
          </ul>
        </nav>

        {/* Action controls: ALWAYS VISIBLE (Theme toggle, user greeting, logout / login) */}
        <div className="navbar-actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>

          {user ? (
            <div className="user-menu">
              <span className="user-greeting" title={`Hi, ${user.name}`}>Hi, {user.name}</span>
              <button type="button" onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsOpen(true)} className="login-btn">
              <FaUserAlt /> Login
            </button>
          )}

          {/* Hamburger toggle (<900px) */}
          <button
            type="button"
            className="hamburger-btn"
            aria-expanded={menuOpen}
            aria-controls="navbar-nav-links"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {menuOpen && (
        <div
          className="navbar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {isOpen && !user && (
        <Modal onClose={() => setIsOpen(false)}>
          <Inputform setIsOpen={setIsOpen} />
        </Modal>
      )}
    </>
  );
}

export default Navbar;