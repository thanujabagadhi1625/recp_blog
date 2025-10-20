// src/components/recpitems.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaUser } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

function Recpitems({ recipes, onUpdate }) {
  const { user, token } = useContext(AuthContext);

  if (!recipes || recipes.length === 0)
    return <h2 style={{textAlign: 'center', marginTop: '80px', color: '#666', fontSize: '24px'}}>No recipes found 🍳</h2>;

  const handleLike = async (recipeId, e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent navigating when clicking the heart
    if (!user) {
      alert("Please login to like recipes");
      return;
    }

    try {
      // Axios instance with auth headers is needed if not set globally
      await axios.post(`http://localhost:4444/api/recipes/${recipeId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onUpdate) onUpdate(); // Re-fetch recipes to show updated like count
    } catch (err) {
      console.error("Failed to like recipe:", err);
    }
  };

  return (
    <div className="container">
      <div className="recipe-grid">
        {recipes.map((item) => (
          <Link to={`/recipe/${item._id}`} key={item._id} className="recipe-card">
            <img 
              src={item.coverImage || "https://via.placeholder.com/400x300?text=Recipe"} 
              alt={item.title} 
            />
            <div className="recipe-card-content">
              <h3>{item.title}</h3>
              <p className="description">
                {item.description?.substring(0, 100)}...
              </p>
              <div className="recipe-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUser />
                  <span>{item.author}</span>
                </div>
                <div className="like-section">
                  <FaHeart
                    onClick={(e) => handleLike(item._id, e)}
                    className="heart-icon"
                    style={{ color: item.likes?.includes(user?.id) ? 'red' : '#ccc' }}
                  />
                  <span>{item.likes?.length || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Recpitems;