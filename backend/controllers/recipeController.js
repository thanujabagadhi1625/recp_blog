const Recipe = require('../models/recipe');
const User = require('../models/user');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
if (process.env.CLOUDINARY_URL) cloudinary.config({ url: process.env.CLOUDINARY_URL });

const getFullImageUrl = (req, imagePath) => {
    if (!imagePath) return imagePath;
    if (imagePath.startsWith('http')) return imagePath;
    const host = req.get('host');
    return `${req.protocol}://${host}${imagePath}`;
};

const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
};

// --- 1. GET ALL RECIPES (Listing & Searching) ---
const getRecipes = async (req, res) => {
    try {
        const { search, category, cuisine, difficulty, sort } = req.query;
        
        let query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (category) query.category = category;
        if (cuisine) query.cuisine = cuisine;
        if (difficulty) query.difficulty = difficulty;

        let sortOption = { createdAt: -1 };
        if (sort === 'popular') sortOption = { viewCount: -1 };
        if (sort === 'quickest') sortOption = { cookTime: 1 };

        const recipes = await Recipe.find(query).sort(sortOption).populate('userId', 'name avatar');
        const mapped = recipes.map((recipe) => {
            const recipeObj = recipe.toObject();
            recipeObj.coverImage = getFullImageUrl(req, recipeObj.coverImage);
            return recipeObj;
        });
        return res.status(200).json(mapped);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// --- 2. GET SINGLE RECIPE ---
const getRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('userId', 'name avatar email');
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
        
        // Increment view count
        recipe.viewCount += 1;
        await recipe.save();

        const recipeObj = recipe.toObject();
        recipeObj.coverImage = getFullImageUrl(req, recipeObj.coverImage);
        return res.status(200).json(recipeObj);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// 💥 THE FIX: Redefine addRecipe as a 'const' and apply robust error handling 💥
const addRecipe = async (req, res) => {
    const { 
        title, 
        description, 
        ingredients, 
        instructions, 
        prepTime, 
        cookTime, 
        servings, 
        tags
    } = req.body;

    const author = req.body.author || req.userName || 'Anonymous';
    const userId = req.userId;

    if (!title || !description || !userId) {
        return res.status(400).json({ 
            message: 'Missing required recipe fields: title, description, or authenticated user data.' 
        });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Recipe image is required. Please upload a cover image.' });
    }

    try {
        const coverImage = req.file.cloudinaryUrl;
        const parsedTags = parseTags(tags);
        const newRecipe = new Recipe({
            title,
            description,
            ingredients,
            instructions,
            prepTime,
            cookTime,
            servings,
            tags: parsedTags,
            author,
            userId,
            coverImage,
        });

        const savedRecipe = await newRecipe.save();
        
        res.status(201).json(savedRecipe);

    } catch (error) {
        console.error('Error creating recipe:', error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: error.message,
                details: error.errors 
            });
        }
        res.status(500).json({ message: 'Internal Server Error during recipe creation.', error: error.message });
    }
};

// --- 4. EDIT RECIPE ---
const editRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
        
        // Check authorization using req.userId (set by auth middleware)
        if (recipe.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to edit this recipe' });
        }

        const updateFields = { ...req.body };
        if (req.file) {
            updateFields.coverImage = req.file.cloudinaryUrl;
        }
        if (req.body.tags) {
            updateFields.tags = parseTags(req.body.tags);
        }

        // Run validators on update
        const updated = await Recipe.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
        return res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};


const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
        
        // Check authorization
        if (recipe.userId.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this recipe' });
        }

        await Recipe.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Recipe deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error in deleting the recipe' });
    }
};


const likeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        // Toggle like status and clear dislike when liking
        if (recipe.likes.includes(req.userId)) {
            recipe.likes = recipe.likes.filter(id => id.toString() !== req.userId);
        } else {
            recipe.likes.push(req.userId);
            recipe.dislikes = recipe.dislikes.filter(id => id.toString() !== req.userId);
        }

        await recipe.save();
        return res.status(200).json({ likes: recipe.likes.length, liked: recipe.likes.includes(req.userId) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

const dislikeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        if (recipe.dislikes.includes(req.userId)) {
            recipe.dislikes = recipe.dislikes.filter(id => id.toString() !== req.userId);
        } else {
            recipe.dislikes.push(req.userId);
            recipe.likes = recipe.likes.filter(id => id.toString() !== req.userId);
        }

        await recipe.save();
        return res.status(200).json({ dislikes: recipe.dislikes.length, disliked: recipe.dislikes.includes(req.userId) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// --- 7. GET USER'S RECIPES ---
const getUserRecipes = async (req, res) => {
    try {
        // Fetch recipes where userId matches the ID in the URL parameter
        const recipes = await Recipe.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        const mapped = recipes.map((recipe) => {
            const recipeObj = recipe.toObject();
            recipeObj.coverImage = getFullImageUrl(req, recipeObj.coverImage);
            return recipeObj;
        });
        return res.status(200).json(mapped);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// --- FINAL EXPORT STATEMENT (FIXES THE ReferenceError) ---
module.exports = { 
    getRecipes, 
    getRecipe, 
    addRecipe, // Now defined as a 'const' above, so this works
    editRecipe, 
    deleteRecipe, 
    likeRecipe, 
    dislikeRecipe,
    getUserRecipes 
};
