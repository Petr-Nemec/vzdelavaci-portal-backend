// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Přihlášení uživatele (vytvoří nového, pokud neexistuje)
router.post('/login', authController.login);

// Získání informací o přihlášeném uživateli
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
