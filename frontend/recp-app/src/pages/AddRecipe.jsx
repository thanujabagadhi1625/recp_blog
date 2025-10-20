import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AddRecipe = () => {
    const { user } = useContext(AuthContext); 
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ingredients: '',
        instructions: '',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        tags: '',
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Please log in to add a recipe.");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...formData,
                author: user.name || 'Unknown Author', 
                userId: user.id || user._id, 
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            };
            await axios.post("http://localhost:4444/api/recipes", payload);
            alert("Recipe added! Yum! 🎉");
            navigate("/my-recipes"); 
        } catch (err) {
            alert(`Oops! Something went wrong.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Share Your Masterpiece! 🍳</h2>
            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="title">Recipe Title 📝</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Short & Snappy Description ✍️</label>
                    <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleChange} required></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="ingredients">Ingredients 🥕</label>
                    <textarea id="ingredients" name="ingredients" placeholder="1 cup of awesome..." rows="5" value={formData.ingredients} onChange={handleChange} required></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="instructions">Instructions 🧑‍🍳</label>
                    <textarea id="instructions" name="instructions" placeholder="First, preheat the fun..." rows="7" value={formData.instructions} onChange={handleChange} required></textarea>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="prepTime">Prep Time (min) 🕒</label>
                        <input type="number" id="prepTime" name="prepTime" value={formData.prepTime} onChange={handleChange} min="0" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cookTime">Cook Time (min) 🔥</label>
                        <input type="number" id="cookTime" name="cookTime" value={formData.cookTime} onChange={handleChange} min="0" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="servings">Servings 🍽️</label>
                        <input type="number" id="servings" name="servings" value={formData.servings} onChange={handleChange} min="1" required />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="tags">Tags (e.g., spicy, vegan) 🏷️</label>
                    <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="Separate with commas" />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Cooking...' : 'Publish Recipe!'}
                </button>
            </form>
        </div>
    );
};

export default AddRecipe;