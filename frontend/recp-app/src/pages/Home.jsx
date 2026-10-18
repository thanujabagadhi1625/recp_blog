import React, { useState, useEffect, useCallback } from "react";
import Recpitems from "../components/recpitems";
import client from "../api/client";

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRecipes = useCallback(async () => {
    try {
      const params = { page, limit: 12 };
      if (searchTerm) params.search = searchTerm;
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;

      const res = await client.get('/api/recipes', { params });
      setRecipes(res.data.items || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    }
  }, [searchTerm, category, difficulty, page]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecipes();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchRecipes]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="home-header">
        <h1>Discover Amazing Recipes 🍽️</h1>
        <div className="filter-controls">
          <input
            type="text"
            placeholder="🔍 Search recipes, ingredients..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select value={category} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            <option value="Breakfast">🍳 Breakfast</option>
            <option value="Lunch">🥗 Lunch</option>
            <option value="Dinner">🍝 Dinner</option>
            <option value="Dessert">🍰 Dessert</option>
            <option value="Snack">🍿 Snack</option>
            <option value="Beverage">🥤 Beverage</option>
          </select>
          <select value={difficulty} onChange={handleDifficultyChange}>
            <option value="">All Levels</option>
            <option value="Easy">😊 Easy</option>
            <option value="Medium">😐 Medium</option>
            <option value="Hard">😰 Hard</option>
          </select>
        </div>
        <p>{total} recipes found</p>
      </div>
      <main>
        <Recpitems recipes={recipes} onUpdate={fetchRecipes} />
        {pages > 1 && (
          <div className="pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span>Page {page} of {pages}</span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;