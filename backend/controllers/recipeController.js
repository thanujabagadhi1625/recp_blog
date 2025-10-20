const Recipe = require('../models/recipe');
const User = require('../models/user');

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

        // Ensure population is correct for displaying author data
        const recipes = await Recipe.find(query).sort(sortOption).populate('userId', 'name avatar');
        return res.status(200).json(recipes);
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

        return res.status(200).json(recipe);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// 💥 THE FIX: Redefine addRecipe as a 'const' and apply robust error handling 💥
const addRecipe = async (req, res) => {
    // 1. Destructure all fields, including 'author' and 'userId' sent from the frontend
    const { 
        title, 
        description, 
        ingredients, 
        instructions, 
        prepTime, 
        cookTime, 
        servings, 
        tags, 
        author, 
        userId // This is the ID sent from the frontend's AuthContext
    } = req.body;

    // Optional: Basic server-side validation check
    if (!title || !description || !author || !userId) {
        return res.status(400).json({ 
            message: 'Missing essential fields: title, description, author, or userId. Check your frontend payload.' 
        });
    }

    try {
        const newRecipe = new Recipe({
            title,
            description,
            ingredients,
            instructions,
            prepTime,
            cookTime,
            servings,
            tags,
            author, 
            userId 
        });

        const savedRecipe = await newRecipe.save();
        
        // Respond with success
        res.status(201).json(savedRecipe); 

    } catch (error) {
        // 🚨 Prevents server crash and sends a clean error 🚨
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

        // Run validators on update
        const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        return res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// --- 5. DELETE RECIPE ---
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
        return res.status(500).json({ error: 'Server error' });
    }
};

// --- 6. LIKE RECIPE ---
const likeRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

        // Toggle like status
        if (recipe.likes.includes(req.userId)) {
            recipe.likes = recipe.likes.filter(id => id.toString() !== req.userId);
        } else {
            recipe.likes.push(req.userId);
        }

        await recipe.save();
        return res.status(200).json({ likes: recipe.likes.length, liked: recipe.likes.includes(req.userId) });
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
        return res.status(200).json(recipes);
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
    getUserRecipes 
};