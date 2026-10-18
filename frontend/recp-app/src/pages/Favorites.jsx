import React, { useState, useEffect, useContext, useCallback } from "react";
import client from "../api/client";
import { AuthContext } from "../context/AuthContext";
import Recpitems from "../components/recpitems";

const Favorites = () => {
  const [activeTab, setActiveTab] = useState("saved");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [favRes, likedRes] = await Promise.all([
        client.get("/api/users/me/favorites"),
        client.get("/api/recipes/liked/me"),
      ]);
      setSavedRecipes(favRes.data || []);
      setLikedRecipes(likedRes.data || []);
    } catch (err) {
      console.error("Failed to fetch recipes", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleTabKeyDown = (e, currentTab) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextTab = currentTab === "saved" ? "liked" : "saved";
      setActiveTab(nextTab);
      const nextTabBtn = document.getElementById(`tab-${nextTab}`);
      if (nextTabBtn) nextTabBtn.focus();
    }
  };

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Loading your collection...</h2>;
  }

  if (!user) {
    return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Please login to see your collection.</h2>;
  }

  const currentRecipes = activeTab === "saved" ? savedRecipes : likedRecipes;

  return (
    <div style={{ minHeight: "70vh", padding: "40px 20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "24px" }}>My Collection</h1>

      <div
        role="tablist"
        aria-label="Favorites tabs"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        <button
          role="tab"
          id="tab-saved"
          type="button"
          aria-selected={activeTab === "saved"}
          aria-controls="tabpanel-saved"
          tabIndex={activeTab === "saved" ? 0 : -1}
          onClick={() => setActiveTab("saved")}
          onKeyDown={(e) => handleTabKeyDown(e, "saved")}
          className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
          style={{
            padding: "10px 24px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: activeTab === "saved" ? "var(--primary)" : "transparent",
            color: activeTab === "saved" ? "var(--white)" : "inherit",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          Saved ({savedRecipes.length})
        </button>
        <button
          role="tab"
          id="tab-liked"
          type="button"
          aria-selected={activeTab === "liked"}
          aria-controls="tabpanel-liked"
          tabIndex={activeTab === "liked" ? 0 : -1}
          onClick={() => setActiveTab("liked")}
          onKeyDown={(e) => handleTabKeyDown(e, "liked")}
          className={`tab-btn ${activeTab === "liked" ? "active" : ""}`}
          style={{
            padding: "10px 24px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: activeTab === "liked" ? "var(--primary)" : "transparent",
            color: activeTab === "liked" ? "var(--white)" : "inherit",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          Liked ({likedRecipes.length})
        </button>
      </div>

      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        {currentRecipes.length > 0 ? (
          <Recpitems recipes={currentRecipes} onUpdate={fetchRecipes} />
        ) : (
          <h2 style={{ textAlign: "center", color: "var(--text-muted)" }}>
            {activeTab === "saved"
              ? "You haven't saved any recipes to favorites yet."
              : "You haven't liked any recipes yet."}
          </h2>
        )}
      </div>
    </div>
  );
};

export default Favorites;