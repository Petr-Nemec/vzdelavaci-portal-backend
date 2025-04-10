// src/controllers/authController.js
const User = require('../models/User');
const admin = require('firebase-admin');

// Přihlášení nebo registrace uživatele
exports.login = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }
    
    // Ověření tokenu
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;
    
    // Kontrola, zda uživatel již existuje
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // Vytvoření nového uživatele
      user = new User({
        firebaseUid: uid,
        email,
        name: name || email.split('@')[0], // Pokud není jméno, použijeme část emailu
        profileImage: picture,
        role: 'student', // Výchozí role
        isApproved: true, // Studenti jsou automaticky schváleni
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await user.save();
    }
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Získání informací o přihlášeném uživateli
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.dbUser;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Pokud je to organizace, načteme i data organizace
    let organizationData = null;
    if (user.role === 'organization' && user.organizationId) {
      const Organization = require('../models/Organization');
      organizationData = await Organization.findById(user.organizationId);
    }
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
        isApproved: user.isApproved,
        organization: organizationData
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
