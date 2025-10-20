import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const EditRecipe = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ingredients: '',
        instructions: '',
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        tags: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecipeData = async () => {
            try {
                const res = await axios.get(`http://localhost:4444/api/recipes/${id}`);
                const recipe = res.data;
                setFormData({
                    title: recipe.title,
                    description: recipe.description,
                    ingredients: recipe.ingredients,
                    instructions: recipe.instructions,
                    prepTime: recipe.prepTime,
                    cookTime: recipe.cookTime,
                    servings: recipe.servings,
                    tags: recipe.tags.join(', '),
                });
            } catch (error) {
                console.error("Failed to fetch recipe for editing", error);
                alert("Could not load recipe data.");
                navigate(`/recipe/${id}`);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeData();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                prepTime: Number(formData.prepTime),
                cookTime: Number(formData.cookTime),
                servings: Number(formData.servings),
            };

            await axios.put(`http://localhost:4444/api/recipes/${id}`, payload);
            alert("Recipe updated successfully! ✅");
            navigate(`/recipe/${id}`);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Update failed.';
            console.error("Error updating recipe:", err);
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <h2>Loading editor...</h2>;

    // The JSX below is updated to use the classes from index.css for proper styling
    return (
        <div className="form-container">
            <h2>Edit Your Recipe</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleChange} required></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="ingredients">Ingredients (List each on a new line)</label>
                    <textarea id="ingredients" name="ingredients" rows="5" value={formData.ingredients} onChange={handleChange} required></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="instructions">Instructions</label>
                    <textarea id="instructions" name="instructions" rows="7" value={formData.instructions} onChange={handleChange} required></textarea>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="prepTime">Prep Time (min)</label>
                        <input type="number" id="prepTime" name="prepTime" value={formData.prepTime} onChange={handleChange} min="0" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cookTime">Cook Time (min)</label>
                        <input type="number" id="cookTime" name="cookTime" value={formData.cookTime} onChange={handleChange} min="0" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="servings">Servings</label>
                        <input type="number" id="servings" name="servings" value={formData.servings} onChange={handleChange} min="1" required />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="tags">Tags (e.g., Italian, Dinner, Quick)</label>
                    <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="Separate with commas" />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default EditRecipe;