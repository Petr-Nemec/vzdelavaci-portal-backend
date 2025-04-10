const admin = require('firebase-admin');
const User = require('../models/User');
const initializeFirebaseAdmin = require('../config/firebase-config');

// Inicializace Firebase Admin
initializeFirebaseAdmin();

// Middleware pro ověření Firebase tokenu
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Najít nebo vytvořit uživatele v naší databázi
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // Uložit informace o uživateli do req objektu
    req.user = decodedToken;
    req.dbUser = user;
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(403).json({ error: 'Unauthorized' });
  }
};

// Middleware pro kontrolu role uživatele
exports.checkRole = (roles) => {
  return async (req, res, next) => {
    // req.dbUser by měl být nastaven authenticate middlewarem
    const user = req.dbUser;
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    if (roles.includes(user.role)) {
      // Kontrola schválení pro organizace
      if (user.role === 'organization' && !user.isApproved && !roles.includes('admin')) {
        return res.status(403).json({ error: 'Organization not approved yet' });
      }
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
