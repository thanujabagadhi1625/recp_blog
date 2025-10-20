// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import Recpitems from "../components/recpitems";
import axios from "axios";

const Home = () => {
  const loaderRecipes = useLoaderData();
  const [recipes, setRecipes] = useState(loaderRecipes);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const fetchRecipes = async () => {
    try {
      let url = 'http://localhost:4444/api/recipes?';
      if (searchTerm) url += `search=${searchTerm}&`;
      if (category) url += `category=${category}&`;
      if (difficulty) url += `difficulty=${difficulty}`;
      
      const res = await axios.get(url);
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Use a useEffect to refetch when filters change, but debounce the search term
  useEffect(() => {
    const handler = setTimeout(() => {
        fetchRecipes();
    }, 500); // Wait 500ms after user stops typing to search
    return () => clearTimeout(handler);
  }, [searchTerm, category, difficulty]);

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