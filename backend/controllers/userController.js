const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const hashpass = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashpass });

    const token = jwt.sign({ email: newUser.email, id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    
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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ email: user.email, id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
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
    return res.status(200).json(user);
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
    
    return res.status(200).json(user.favorites);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { userSignup, userLogin, getUser, addFavorite, removeFavorite, getFavorites };