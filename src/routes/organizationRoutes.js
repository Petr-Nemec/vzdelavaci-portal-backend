// src/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authenticate, checkRole } = require('../middleware/auth');

// Veřejné routy
router.get('/', organizationController.getOrganizations);
router.get('/:id', organizationController.getOrganization);
router.get('/:id/events', organizationController.getOrganizationEvents);

// Chráněné routy
router.post('/', authenticate, organizationController.createOrganization);
router.put('/:id', authenticate, checkRole(['organization', 'admin']), organizationController.updateOrganization);

module.exports = router;
