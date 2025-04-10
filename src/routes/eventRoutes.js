// src/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, checkRole } = require('../middleware/auth');

// Veřejné routy
router.get('/', eventController.getEvents);
router.get('/calendar', eventController.getCalendarEvents);
router.get('/:id', eventController.getEvent);

// Chráněné routy - pouze pro organizace a adminy
router.post('/', authenticate, checkRole(['organization', 'admin']), eventController.createEvent);
router.put('/:id', authenticate, checkRole(['organization', 'admin']), eventController.updateEvent);
router.delete('/:id', authenticate, checkRole(['organization', 'admin']), eventController.deleteEvent);

module.exports = router;
