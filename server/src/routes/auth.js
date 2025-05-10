const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const User = require('../models/user');
const { authenticate } = require('../middleware/auth');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // Will be hashed by the model hook
      phoneNumber,
      address,
      role: 'customer',
      kycStatus: 'pending'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // If 2FA code not provided, ask user to provide it
      if (!twoFactorCode) {
        return res.status(200).json({
          message: 'Two-factor authentication required',
          requiresTwoFactor: true,
          userId: user.id
        });
      }
      
      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode
      });
      
      if (!verified) {
        return res.status(401).json({ message: 'Invalid two-factor code' });
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update user last login and refresh token
    user.lastLogin = new Date();
    user.refreshToken = refreshToken;
    await user.save();
    
    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find the user
    const user = await User.findOne({ 
      where: { 
        id: decoded.id,
        refreshToken
      } 
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();
    
    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// Setup 2FA
router.post('/setup-2fa', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `BANKS-MO:${user.email}`
    });
    
    // Save secret to user
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    res.json({
      message: 'Two-factor authentication setup initiated',
      secret: secret.base32,
      otpAuthUrl: secret.otpauth_url
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error during 2FA setup' });
  }
});

// Verify and enable 2FA
router.post('/verify-2fa', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();
    
    res.json({ message: 'Two-factor authentication enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: 'Server error during 2FA verification' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user and clear refresh token
    const user = await User.findByPk(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router; 