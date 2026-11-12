import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Demo accounts for instant seamless testing
router.get('/demo-accounts', (_req, res) => {
  res.json({
    accounts: [
      { role: 'ELDER', email: 'elder@buddy.com', name: 'Ramesh Sharma (Elder)', password: 'password123' },
      { role: 'CAREGIVER', email: 'caregiver@buddy.com', name: 'Priya Sharma (Caregiver Daughter)', password: 'password123' },
      { role: 'ADMIN', email: 'admin@buddy.com', name: 'Dr. Anand Joshi (Platform Admin)', password: 'password123' }
    ]
  });
});

router.post('/register', (req, res) => {
  try {
    const { email, password, name, role = 'ELDER', phone, preferredLang = 'en', emergencyContact, emergencyPhone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Please enter your name, email, and password.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = db.createUser({
      email,
      passwordHash,
      name,
      role: role === 'CAREGIVER' || role === 'ADMIN' ? role : 'ELDER',
      phone: phone || '',
      preferredLang: preferredLang || 'en',
      fontSize: 'large'
    });

    if (user.role === 'ELDER' && (emergencyContact || emergencyPhone)) {
      db.updateElderProfile(user.id, {
        emergencyContact,
        emergencyPhone
      });
    }

    const token = generateToken(user);
    const elderProfile = user.role === 'ELDER' ? db.getElderProfile(user.id) : undefined;

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferredLang: user.preferredLang,
        fontSize: user.fontSize,
        elderProfile
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);
    const elderProfile = user.role === 'ELDER' ? db.getElderProfile(user.id) : undefined;

    res.json({
      message: 'Welcome back!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferredLang: user.preferredLang,
        fontSize: user.fontSize,
        elderProfile
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const elderProfile = user.role === 'ELDER' ? db.getElderProfile(user.id) : undefined;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      preferredLang: user.preferredLang,
      fontSize: user.fontSize,
      elderProfile
    }
  });
});

router.put('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { name, phone, preferredLang, fontSize, emergencyContact, emergencyPhone, medicalNotes } = req.body;

  const updatedUser = db.updateUser(user.id, {
    ...(name && { name }),
    ...(phone !== undefined && { phone }),
    ...(preferredLang && { preferredLang }),
    ...(fontSize && { fontSize })
  });

  let elderProfile = undefined;
  if (user.role === 'ELDER') {
    elderProfile = db.updateElderProfile(user.id, {
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(emergencyPhone !== undefined && { emergencyPhone }),
      ...(medicalNotes !== undefined && { medicalNotes })
    });
  }

  res.json({
    message: 'Profile updated successfully',
    user: {
      ...updatedUser,
      elderProfile
    }
  });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
