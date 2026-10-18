const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

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
    if (err.code === 11000) {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const userLogin = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

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
    return res.status(500).json({ message: 'Server error' });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar bio favoriteCuisines hobbies favorites')
      .populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const profile = user.toObject();
    profile.favorites = profile.favorites.map((recipe) => ({
      ...recipe,
      coverImage: getFullImageUrl(req, recipe.coverImage),
    }));
    return res.status(200).json(profile);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
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
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
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
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const mapped = user.favorites.map((recipe) => ({
      ...recipe,
      coverImage: getFullImageUrl(req, recipe.coverImage),
    }));
    return res.status(200).json(mapped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
 
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password').populate('favorites');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const result = user.toObject();
    result.favorites = result.favorites.map((recipe) => ({
      ...recipe,
      coverImage: getFullImageUrl(req, recipe.coverImage),
    }));
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
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
    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      favorites: user.favorites,
      bio: user.bio,
      favoriteCuisines: user.favoriteCuisines,
      hobbies: user.hobbies,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const query = String(req.query.q || '').slice(0, 50);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      name: { $regex: escaped, $options: 'i' },
    })
      .select('name avatar bio favoriteCuisines hobbies')
      .limit(20);
    return res.status(200).json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { userSignup, userLogin, getUser, addFavorite, removeFavorite, getFavorites, getMe, updateProfile, searchUsers };