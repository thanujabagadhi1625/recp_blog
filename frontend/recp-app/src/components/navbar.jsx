// src/components/Navbar.jsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "./modal";
import Inputform from "./inputform";
import { AuthContext } from "../context/AuthContext";
import { FaUserAlt } from "react-icons/fa";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to home page after logout
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
              <li><Link to="/chat/requests">Chat Requests</Link></li>
              <li><Link to="/add-recipe">Add Recipe</Link></li>
            </>
          )}
          
          {user ? (
            <li className="user-menu">
              <span>Welcome, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          ) : (
            <li onClick={() => setIsOpen(true)} className="flex items-center gap-2">
              <FaUserAlt /> Login
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