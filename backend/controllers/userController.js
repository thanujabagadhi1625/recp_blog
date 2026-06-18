const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
 
const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;
  if (imagePath.startsWith('http')) return imagePath;
  const host = req.get('host');
  return `${req.protocol}://${host}${imagePath}`;
};

const userSignup = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }

    email = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const hashpass = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashpass });

    const token = jwt.sign({ email: newUser.email, id: newUser._id, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(201).json({ 
      token, 
      user: { 
        id: newUser._id, 
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar 
      } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const userLogin = async (req, res) => {
  try {
    let { email, password } = req.body; // 'email' may contain username or email
    if (!email || !password) return res.status(400).json({ message: 'Identifier and password required' });

    email = String(email).trim();

    // Allow login by email or by username (name)
    let user;
    if (email.includes('@')) {
      // case-insensitive email lookup
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // fallback to case-insensitive search in DB
        user = await User.findOne({ email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
      }
    } else {
      user = await User.findOne({ name: email });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ email: user.email, id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    return res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        favorites: user.favorites 
      } 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const profile = user.toObject();
    profile.favorites = profile.favorites.map((recipe) => ({
      ...recipe,
      coverImage: getFullImageUrl(req, recipe.coverImage),
    }));
    return res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const addFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.favorites.includes(req.params.recipeId)) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    user.favorites.push(req.params.recipeId);
    await user.save();

    return res.status(200).json({ message: 'Added to favorites', favorites: user.favorites });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.favorites = user.favorites.filter(id => id.toString() !== req.params.recipeId);
    await user.save();

    return res.status(200).json({ message: 'Removed from favorites', favorites: user.favorites });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const mapped = user.favorites.map((recipe) => ({
      ...recipe.toObject(),
      coverImage: getFullImageUrl(req, recipe.coverImage),
    }));
    return res.status(200).json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
 
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password').populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const result = user.toObject();
    result.favorites = result.favorites.map((recipe) => ({
      ...recipe.toObject(),
      coverImage: getFullImageUrl(req, recipe.coverImage),
    }));
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { avatar, bio, favoriteCuisines, hobbies } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (favoriteCuisines !== undefined) {
      user.favoriteCuisines = Array.isArray(favoriteCuisines)
        ? favoriteCuisines
        : String(favoriteCuisines).split(',').map((item) => item.trim()).filter(Boolean);
    }
    if (hobbies !== undefined) {
      user.hobbies = Array.isArray(hobbies)
        ? hobbies
        : String(hobbies).split(',').map((item) => item.trim()).filter(Boolean);
    }

    await user.save();
    const profile = user.toObject();
    delete profile.password;
    return res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = req.query.q || '';
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('name email avatar bio favoriteCuisines hobbies');
    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { userSignup, userLogin, getUser, addFavorite, removeFavorite, getFavorites, getMe, updateProfile, searchUsers };