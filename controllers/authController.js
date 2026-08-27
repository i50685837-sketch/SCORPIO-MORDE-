const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      throw new Error('Please provide email and password');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.statusCode = 400;
      throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      credits: 100
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        apiKey: user.apiKey,
        webhookUrl: user.webhookUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.statusCode = 400;
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        apiKey: user.apiKey,
        webhookUrl: user.webhookUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        credits: user.credits,
        apiKey: user.apiKey,
        webhookUrl: user.webhookUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/auth/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const { webhookUrl } = req.body;
    const user = await User.findById(req.user.id);

    if (webhookUrl !== undefined) {
      user.webhookUrl = webhookUrl;
      await user.save();
    }

    res.status(200).json({
      success: true,
      webhookUrl: user.webhookUrl
    });
  } catch (error) {
    next(error);
  }
};
