import React, { useState, useEffect, useContext, useCallback } from "react";
import client from "../api/client";
import { AuthContext } from "../context/AuthContext";
import Recpitems from "../components/recpitems";
import { Link } from "react-router-dom";

const MyRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchUserRecipes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await client.get(`/api/recipes/user/${user.id}`);
      setRecipes(res.data);
    } catch (err) {
      console.error("Failed to fetch user recipes", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserRecipes();
  }, [fetchUserRecipes]);

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Loading your recipes...</h2>;
  }

  if (!user) {
    return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Please login to see your recipes.</h2>;
  }

  return (
    <div style={{ minHeight: "70vh", padding: "40px 20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px" }}>My Recipes 📖</h1>
      {recipes.length > 0 ? (
        <Recpitems recipes={recipes} onUpdate={fetchUserRecipes} />
      ) : (
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: "#666" }}>You haven't added any recipes yet.</h2>
          <Link
            to="/add-recipe"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 25px",
              background: "#667eea",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "18px",
            }}
          >
            + Add Your First Recipe
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRecipes;