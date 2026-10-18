const Recipe = require('../models/recipe');
const User = require('../models/user');
const Comment = require('../models/comment');
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
        const { id } = req.params;
        const noView = req.query.noview === '1';

        let recipe;
        if (noView) {
            recipe = await Recipe.findById(id).populate('userId', 'name avatar');
        } else {
            recipe = await Recipe.findByIdAndUpdate(
                id,
                { $inc: { viewCount: 1 } },
                { new: true, timestamps: false }
            ).populate('userId', 'name avatar');
        }
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        const recipeObj = recipe.toObject();
        recipeObj.coverImage = getFullImageUrl(req, recipeObj.coverImage);
        return res.status(200).json(recipeObj);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid recipe ID format' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const addRecipe = async (req, res) => {
    const { 
        title, 
        description, 
        ingredients, 
        instructions, 
        prepTime, 
        cookTime, 
        servings, 
        tags,
        category,
        cuisine,
        difficulty
    } = req.body;

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
        const user = await User.findById(userId);
        const author = user ? user.name : 'Anonymous';
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
            category: category || undefined,
            cuisine: cuisine || undefined,
            difficulty: difficulty || undefined,
            author,
            userId,
            coverImage,
            coverImagePublicId: req.file.cloudinaryPublicId,
        });

        const savedRecipe = await newRecipe.save();
        res.status(201).json(savedRecipe);

    } catch (error) {
        console.error('Error creating recipe:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation failed',
                details: error.errors 
            });
        }
        res.status(500).json({ message: 'Internal Server Error during recipe creation.' });
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

        const allowedFields = [
            'title',
            'description',
            'ingredients',
            'instructions',
            'category',
            'cuisine',
            'difficulty',
            'prepTime',
            'cookTime',
            'servings',
            'tags',
            'coverImage',
        ];
        const updateFields = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        }

        if (req.file) {
            updateFields.coverImage = req.file.cloudinaryUrl;
            updateFields.coverImagePublicId = req.file.cloudinaryPublicId;
            if (recipe.coverImagePublicId) {
                try {
                    await cloudinary.uploader.destroy(recipe.coverImagePublicId);
                } catch (cErr) {
                    console.error('Error removing old Cloudinary image:', cErr);
                }
            }
        }
        if (req.body.tags) {
            updateFields.tags = parseTags(req.body.tags);
        }

        // Run validators on update
        const updated = await Recipe.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
        return res.status(200).json(updated);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid recipe ID format' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
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

        if (recipe.coverImagePublicId) {
            try {
                await cloudinary.uploader.destroy(recipe.coverImagePublicId);
            } catch (cErr) {
                console.error('Error removing Cloudinary image:', cErr);
            }
        }

        await Comment.deleteMany({ recipeId: recipe._id });
        await User.updateMany({ favorites: recipe._id }, { $pull: { favorites: recipe._id } });
        await Recipe.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Recipe deleted' });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid recipe ID format' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Error in deleting the recipe' });
    }
};

const likeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        const isLiked = recipe.likes.some(id => id.toString() === req.userId);

        let updatedRecipe;
        if (isLiked) {
            updatedRecipe = await Recipe.findByIdAndUpdate(
                req.params.id,
                { $pull: { likes: req.userId } },
                { new: true }
            );
            await User.findByIdAndUpdate(req.userId, { $pull: { favorites: recipe._id } });
            return res.status(200).json({ likes: updatedRecipe.likes.length, liked: false });
        } else {
            updatedRecipe = await Recipe.findByIdAndUpdate(
                req.params.id,
                {
                    $addToSet: { likes: req.userId },
                    $pull: { dislikes: req.userId }
                },
                { new: true }
            );
            await User.findByIdAndUpdate(req.userId, { $addToSet: { favorites: recipe._id } });
            return res.status(200).json({ likes: updatedRecipe.likes.length, liked: true });
        }
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid recipe ID format' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const dislikeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        const isDisliked = recipe.dislikes.some(id => id.toString() === req.userId);

        let updatedRecipe;
        if (isDisliked) {
            updatedRecipe = await Recipe.findByIdAndUpdate(
                req.params.id,
                { $pull: { dislikes: req.userId } },
                { new: true }
            );
            return res.status(200).json({ dislikes: updatedRecipe.dislikes.length, disliked: false });
        } else {
            updatedRecipe = await Recipe.findByIdAndUpdate(
                req.params.id,
                {
                    $addToSet: { dislikes: req.userId },
                    $pull: { likes: req.userId }
                },
                { new: true }
            );
            return res.status(200).json({ dislikes: updatedRecipe.dislikes.length, disliked: true });
        }
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid recipe ID format' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
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
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    getRecipes, 
    getRecipe, 
    addRecipe, 
    editRecipe, 
    deleteRecipe, 
    likeRecipe, 
    dislikeRecipe,
    getUserRecipes 
};
