import React, { useState, useEffect, useCallback } from "react";
import Recpitems from "../components/recpitems";
import axios from "axios";

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const fetchRecipes = useCallback(async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;

      const res = await axios.get('http://localhost:4444/api/recipes', { params });
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [searchTerm, category, difficulty]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecipes();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchRecipes]);

  return (
    <div>
      <div className="home-header">
        <h1>Discover Amazing Recipes 🍽️</h1>
        <div className="filter-controls">
          <input
            type="text"
            placeholder="🔍 Search recipes, ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Breakfast">🍳 Breakfast</option>
            <option value="Lunch">🥗 Lunch</option>
            <option value="Dinner">🍝 Dinner</option>
            <option value="Dessert">🍰 Dessert</option>
            <option value="Snack">🍿 Snack</option>
            <option value="Beverage">🥤 Beverage</option>
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All Levels</option>
            <option value="Easy">😊 Easy</option>
            <option value="Medium">😐 Medium</option>
            <option value="Hard">😰 Hard</option>
          </select>
        </div>
        <p>{recipes.length} recipes found</p>
      </div>
      <main>
        <Recpitems recipes={recipes} onUpdate={fetchRecipes} />
      </main>
    </div>
  );
};

export default Home;