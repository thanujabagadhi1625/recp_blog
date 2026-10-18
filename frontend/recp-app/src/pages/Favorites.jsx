import React, { useState, useEffect, useContext, useCallback } from "react";
import client from "../api/client";
import { AuthContext } from "../context/AuthContext";
import Recpitems from "../components/recpitems";

const Favorites = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await client.get("/api/users/me/favorites");
      setRecipes(res.data);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Loading your favorites...</h2>;
  }

  if (!user) {
    return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Please login to see your favorites.</h2>;
  }

  return (
    <div style={{ minHeight: "70vh", padding: "40px 20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px" }}>My Favorites ❤️</h1>
      {recipes.length > 0 ? (
        <Recpitems recipes={recipes} onUpdate={fetchFavorites} />
      ) : (
        <h2 style={{ textAlign: "center", color: "#666" }}>You haven't favorited any recipes yet.</h2>
      )}
    </div>
  );
};

export default Favorites;