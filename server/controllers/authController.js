const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc Register User
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Direct admin login route for demo/testing
    if (email === 'admin@presidencyuniversity.in' && password === 'adminpassword123') {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: 'Janith VC',
          email: 'admin@presidencyuniversity.in',
          password: 'adminpassword123',
          role: 'admin',
        });
      }
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: 'admin',
        token: generateToken(user._id),
      });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};