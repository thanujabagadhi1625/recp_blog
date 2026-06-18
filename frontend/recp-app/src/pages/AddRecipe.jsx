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
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Please log in to add a recipe.");
            return;
        }
        if (!selectedFile) {
            alert('Please upload a photo for your recipe.');
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

            const bodyFormData = new FormData();
            bodyFormData.append('coverImage', selectedFile);
            Object.entries(payload).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => bodyFormData.append(key, item));
                } else {
                    bodyFormData.append(key, value);
                }
            });

            await axios.post("http://localhost:4444/api/recipes", bodyFormData);
            alert("Recipe added! Yum! 🎉");
            navigate("/my-recipes");
        } catch (err) {
            console.error('Add recipe failed:', err.response?.data || err.message || err);
            const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Oops! Something went wrong.';
            alert(`Error: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>Share Your Masterpiece! 🍳</h2>
            <div
                role="alert"
                aria-live="polite"
                style={{
                    background: '#fff4e5',
                    border: '1px solid #ffd1a3',
                    padding: '10px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    color: '#663c00',
                }}
            >
                <strong>Warning:</strong> Do not post personal photos or images
                with identifiable people. Only upload food photos you own or
                have permission to share.
            </div>
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
                    <label htmlFor="coverImage">Recipe Photo 📷</label>
                    <input type="file" id="coverImage" name="coverImage" onChange={handleFileChange} accept="image/*" />
                    <p style={{ color: '#a33', fontSize: '0.9rem', marginTop: '6px' }}>
                        Please do not upload personal photos or images that show
                        identifiable people.
                    </p>
                </div>
                {previewUrl && (
                    <div className="form-group">
                        <p>Photo preview:</p>
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }} />
                    </div>
                )}
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