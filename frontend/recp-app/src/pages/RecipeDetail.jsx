// src/pages/RecipeDetail.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { FaClock, FaUserFriends, FaGlobe, FaHeart, FaEdit, FaTrash } from "react-icons/fa";

const RecipeDetail = () => {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:4444/api/recipes/${id}`);
                setRecipe(res.data);
                setError("");
            } catch (err) {
                console.error(err);
                setError("Recipe not found or failed to load.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecipe();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this recipe?")) {
            try {
                await axios.delete(`http://localhost:4444/api/recipes/${id}`);
                alert("Recipe deleted successfully!");
                navigate("/my-recipes");
            } catch (err) {
                alert("Failed to delete recipe.");
            }
        }
    };

    const handleEdit = () => {
        navigate(`/edit-recipe/${id}`);
    };

    if (loading) return <h2 style={{ textAlign: "center", marginTop: "80px" }}>Loading Recipe...</h2>;
    if (error) return <h2 style={{ textAlign: "center", marginTop: "80px", color: "red" }}>{error}</h2>;
    if (!recipe) return null;
    
    // Check if the current logged-in user is the author of the recipe
    const isAuthor = user && recipe.userId && user.id === recipe.userId._id;

    return (
        <div className="recipe-detail-container">
            <header className="recipe-detail-header">
                <h1>{recipe.title}</h1>
                <p className="description">{recipe.description}</p>
            </header>

            <div className="recipe-stats">
                <div className="stat-item">
                    <img src={recipe.userId?.avatar || "https://via.placeholder.com/150"} alt={recipe.author} style={{ width: "40px", height: "40px", borderRadius: "50%" }}/>
                    <strong>{recipe.author}</strong>
                </div>
                <div className="stat-item"><FaClock /> {recipe.prepTime} min (Prep)</div>
                <div className="stat-item"><FaClock /> {recipe.cookTime} min (Cook)</div>
                <div className="stat-item"><FaUserFriends /> Serves {recipe.servings}</div>
                {recipe.cuisine && <div className="stat-item"><FaGlobe /> {recipe.cuisine}</div>}
                <div className="stat-item"><FaHeart style={{ color: "red" }} /> {recipe.likes?.length || 0}</div>
            </div>

            {isAuthor && (
                <div className="author-controls">
                    <button onClick={handleEdit} className="edit-btn"><FaEdit /> Edit</button>
                    <button onClick={handleDelete} className="delete-btn"><FaTrash /> Delete</button>
                </div>
            )}

            <main className="recipe-detail-main">
                <img src={recipe.coverImage || "https://via.placeholder.com/900x500?text=Recipe"} alt={recipe.title} />
                <div className="recipe-content-grid">
                    <section className="ingredients-section">
                        <h2>Ingredients</h2>
                        <div>{recipe.ingredients}</div>
                    </section>
                    <section className="instructions-section">
                        <h2>Instructions</h2>
                        <div>{recipe.instructions}</div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default RecipeDetail;