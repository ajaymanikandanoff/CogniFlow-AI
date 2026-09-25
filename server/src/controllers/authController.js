const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_study_coach_key_2026';

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, course, semester, dailyAvailableHours } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingUser = store.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = store.insert('users', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student'
    });

    const studentProfile = store.insert('studentProfiles', {
      userId: newUser._id,
      name: newUser.name,
      email: newUser.email,
      course: course || '',
      semester: semester || '',
      dailyAvailableHours: dailyAvailableHours ? parseFloat(dailyAvailableHours) : 3,
      preferredStudyTime: 'morning',
      learningPreferences: {
        focusSessionDuration: 45,
        breakDuration: 10,
        learningStyle: 'visual_and_practice',
        adaptiveFrequency: 'high'
      },
      onboardingCompleted: false
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      profile: studentProfile
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = store.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const profile = store.findOne('studentProfiles', { userId: user._id }) || {
      userId: user._id,
      name: user.name,
      email: user.email,
      course: '',
      dailyAvailableHours: 3
    };

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = store.findById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const profile = store.findOne('studentProfiles', { userId: user._id });
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};
