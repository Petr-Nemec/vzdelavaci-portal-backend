// src/controllers/adminController.js - implementace admin controlleru
const User = require('../models/User');
const Organization = require('../models/Organization');
const Event = require('../models/Event');

// Seznam čekajících organizací
exports.getPendingOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching pending organizations:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Seznam organizací pro admina
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find()
      .sort({ name: 1 })
      .populate('createdBy', 'name email');
    
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Schválení organizace
exports.approveOrganization = async (req, res) => {
  try {
    const organizationId = req.params.id;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    organization.isApproved = true;
    organization.updatedAt = new Date();
    await organization.save();
    
    // Schválení uživatele organizace
    const user = await User.findById(organization.createdBy);
    if (user) {
      user.isApproved = true;
      await user.save();
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error approving organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Zamítnutí organizace
exports.rejectOrganization = async (req, res) => {
  try {
    const organizationId = req.params.id;
    
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Nastav organizaci na zamítnuto
    organization.isApproved = false;
    organization.updatedAt = new Date();
    await organization.save();
    
    res.json(organization);
  } catch (error) {
    console.error('Error rejecting organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Seznam čekajících akcí
exports.getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .populate('organizerId', 'name')
      .populate('createdBy', 'name email');
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching pending events:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Seznam akcí pro admina
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ startDate: -1 })
      .populate('organizerId', 'name')
      .populate('createdBy', 'name email');
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Schválení akce
exports.approveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    event.isApproved = true;
    event.updatedAt = new Date();
    await event.save();
    
    res.json(event);
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Zamítnutí akce
exports.rejectEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    event.isApproved = false;
    event.updatedAt = new Date();
    await event.save();
    
    res.json(event);
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Seznam uživatelů
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name');
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Aktualizace role uživatele
exports.updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    // Validace role
    if (!['student', 'organization', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Aktualizace uživatele
    user.role = role;
    user.updatedAt = new Date();
    await user.save();
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
