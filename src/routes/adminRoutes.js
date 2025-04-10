// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, checkRole } = require('../middleware/auth');

// Všechny routy vyžadují roli admin
router.use(authenticate);
router.use(checkRole(['admin']));

// Správa organizací
router.get('/organizations', adminController.getOrganizations);
router.get('/pending-organizations', adminController.getPendingOrganizations);
router.put('/organizations/:id/approve', adminController.approveOrganization);
router.put('/organizations/:id/reject', adminController.rejectOrganization);

// Správa akcí
router.get('/events', adminController.getEvents);
router.get('/pending-events', adminController.getPendingEvents);
router.put('/events/:id/approve', adminController.approveEvent);
router.put('/events/:id/reject', adminController.rejectEvent);

// Správa uživatelů
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);

module.exports = router;
