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
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
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

        const fetchComments = async () => {
            try {
                const res = await axios.get(`http://localhost:4444/api/comments/recipe/${id}`);
                setComments(res.data);
            } catch (err) {
                console.error('Failed to load comments', err);
            }
        };

        fetchRecipe();
        fetchComments();
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

    const handleLikeRecipe = async () => {
        if (!user) {
            alert('Please log in to like recipes.');
            return;
        }

        try {
            await axios.post(`http://localhost:4444/api/recipes/${id}/like`);
            const res = await axios.get(`http://localhost:4444/api/recipes/${id}`);
            setRecipe(res.data);
        } catch (err) {
            console.error('Failed to like recipe', err);
        }
    };

    const handleDislikeRecipe = async () => {
        if (!user) {
            alert('Please log in to dislike recipes.');
            return;
        }

        try {
            await axios.post(`http://localhost:4444/api/recipes/${id}/dislike`);
            const res = await axios.get(`http://localhost:4444/api/recipes/${id}`);
            setRecipe(res.data);
        } catch (err) {
            console.error('Failed to dislike recipe', err);
        }
    };

    const handleFavorite = async () => {
        if (!user) {
            alert('Please log in to add favorites.');
            return;
        }
        try {
            await axios.post(`http://localhost:4444/api/users/favorites/${recipe._id}`);
            alert('Added to favorites');
        } catch (err) {
            console.error('Failed to add favorite', err);
            alert(err.response?.data?.message || 'Unable to add favorite');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in to post a comment.');
            return;
        }
        if (!newComment.trim() && !replyText.trim()) {
            return;
        }
        setCommentLoading(true);

        try {
            const payload = {
                text: replyTo ? replyText.trim() : newComment.trim(),
                parentId: replyTo || undefined,
            };
            await axios.post(`http://localhost:4444/api/comments/recipe/${id}`, payload);
            setNewComment('');
            setReplyTo(null);
            setReplyText('');
            const res = await axios.get(`http://localhost:4444/api/comments/recipe/${id}`);
            setComments(res.data);
        } catch (err) {
            console.error('Failed to submit comment', err);
        } finally {
            setCommentLoading(false);
        }
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
                <div className="stat-item" onClick={handleLikeRecipe} style={{ cursor: 'pointer' }}>
                    <FaHeart style={{ color: recipe.likes?.includes(user?.id) ? 'red' : '#888' }} /> {recipe.likes?.length || 0}
                </div>
                <div className="stat-item" onClick={handleDislikeRecipe} style={{ cursor: 'pointer' }}>
                    <FaHeart style={{ transform: 'rotate(180deg)', color: recipe.dislikes?.includes(user?.id) ? 'blue' : '#888' }} /> {recipe.dislikes?.length || 0}
                </div>
            </div>

            {isAuthor && (
                <div className="author-controls">
                    <button onClick={handleEdit} className="edit-btn"><FaEdit /> Edit</button>
                    <button onClick={handleDelete} className="delete-btn"><FaTrash /> Delete</button>
                </div>
            )}
            {user && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button onClick={handleFavorite} className="favorite-btn">Add to Favorites</button>
                    <button onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Recipe link copied to clipboard!');
                    }} className="share-btn">Share Recipe</button>
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

            <section className="comments-section">
                <div className="comments-header">
                    <h2>Comments</h2>
                    <p>{comments.length} comment{comments.length === 1 ? '' : 's'}</p>
                </div>
                <form onSubmit={handleCommentSubmit} className="comment-form">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share a quick tip or ask a question..."
                        rows={3}
                    />
                    <button type="submit" disabled={commentLoading}>
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
                <div className="comment-list">
                    {comments.map((comment) => (
                        <div key={comment._id} className="comment-card">
                            <div className="comment-author">
                                <strong>{comment.author}</strong>
                                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <p>{comment.text}</p>
                            <button
                                type="button"
                                onClick={() => setReplyTo(replyTo === comment._id ? null : comment._id)}
                                style={{ marginTop: '8px', padding: '6px 10px', cursor: 'pointer' }}
                            >
                                {replyTo === comment._id ? 'Cancel Reply' : 'Reply'}
                            </button>
                            {replyTo === comment._id && (
                                <div style={{ marginTop: '12px' }}>
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Write your reply..."
                                        rows={3}
                                        style={{ width: '100%', marginBottom: '8px' }}
                                    />
                                    <button type="button" onClick={handleCommentSubmit} disabled={commentLoading}>
                                        {commentLoading ? 'Posting...' : 'Post Reply'}
                                    </button>
                                </div>
                            )}
                            {comment.children?.length > 0 && (
                                <div style={{ marginLeft: '20px', marginTop: '12px' }}>
                                    {comment.children.map((reply) => (
                                        <div key={reply._id} className="comment-card" style={{ background: '#f8f8f8', marginTop: '10px' }}>
                                            <div className="comment-author">
                                                <strong>{reply.author}</strong>
                                                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p>{reply.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default RecipeDetail;