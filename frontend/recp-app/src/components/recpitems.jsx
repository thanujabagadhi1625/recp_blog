import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaUser } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import client from "../api/client";

function Recpitems({ recipes, onUpdate }) {
  const { user, token, login } = useContext(AuthContext);

  if (!recipes || recipes.length === 0)
    return <h2 style={{textAlign: 'center', marginTop: '80px', color: '#666', fontSize: '24px'}}>No recipes found 🍳</h2>;

  const handleLike = async (recipeId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please login to like recipes");
      return;
    }

    try {
      await client.post(`/api/recipes/${recipeId}/like`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to like recipe:", err);
    }
  };

  const handleToggleFavorite = async (recipeId, isFav, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please login to save recipes to favorites");
      return;
    }

    try {
      if (isFav) {
        const res = await client.delete(`/api/users/favorites/${recipeId}`);
        login(token || localStorage.getItem('token'), { ...user, favorites: res.data.favorites });
      } else {
        const res = await client.post(`/api/users/favorites/${recipeId}`);
        login(token || localStorage.getItem('token'), { ...user, favorites: res.data.favorites });
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to update favorites:", err);
    }
  };

  return (
    <div className="container">
      <div className="recipe-grid">
        {recipes.map((item) => {
          const isLiked = Boolean(
            user && item.likes?.some((id) => (id?._id || id)?.toString() === user.id?.toString())
          );
          const isFavorite = Boolean(
            user?.favorites?.some((fav) => {
              const favId = typeof fav === 'object' && fav !== null ? (fav._id || fav.id) : fav;
              return favId?.toString() === item._id?.toString();
            })
          );

          return (
            <Link to={`/recipe/${item._id}`} key={item._id} className="recipe-card">
              <img 
                src={item.coverImage || "/placeholder.svg"} 
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
                    <span>{item.author || item.userId?.name}</span>
                  </div>
                  <div className="actions-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleLike(item._id, e)}
                      className="card-action-btn like-btn"
                      aria-label={isLiked ? "Unlike recipe" : "Like recipe"}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                    >
                      {isLiked ? <FaHeart style={{ color: 'red' }} /> : <FaRegHeart style={{ color: '#888' }} />}
                      <span>{item.likes?.length || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(item._id, isFavorite, e)}
                      className="card-action-btn favorite-btn"
                      aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                      {isFavorite ? <FaBookmark style={{ color: '#e63950' }} /> : <FaRegBookmark style={{ color: '#888' }} />}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Recpitems;