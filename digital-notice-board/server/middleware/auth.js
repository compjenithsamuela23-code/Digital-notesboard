const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// File database path
const DB_PATH = path.join(__dirname, '../database.json');

// Helper to read database
const readDatabase = async () => {
  const data = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(data);
};

// Login - FIXED VERSION
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Read database
    const db = await readDatabase();
    
    // Find user in file database
    const user = db.users.find(u => u.email === email.trim().toLowerCase());
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password (plain text comparison since it's stored as plain text)
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Login successful - create simple token
    const token = `file-auth-${Date.now()}-${user.id}`;
    
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'admin'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Simple register endpoint (for creating new users if needed)
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await readDatabase();
    
    // Check if user already exists
    const existingUser = db.users.find(u => u.email === email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const newUser = {
      id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.trim().toLowerCase(),
      password: password, // Store as plain text for now
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    
    // Save to database
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

module.exports = router;