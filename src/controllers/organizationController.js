// src/controllers/organizationController.js - implementace controlleru pro organizace
const Organization = require('../models/Organization');
const User = require('../models/User');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// Získání seznamu organizací
exports.getOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const query = { isApproved: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    const total = await Organization.countDocuments(query);
    
    const organizations = await Organization.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      organizations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Získání detailu organizace
exports.getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    if (!organization.isApproved) {
      // Pokud organizace není schválena, mohou ji prohlížet pouze vlastník nebo admin
      if (req.user) {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user || (user._id.toString() !== organization.createdBy.toString() && user.role !== 'admin')) {
          return res.status(403).json({ error: 'Organization not approved yet' });
        }
      } else {
        return res.status(403).json({ error: 'Organization not approved yet' });
      }
    }
    
    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Získání akcí organizace
exports.getOrganizationEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const organizationId = req.params.id;
    
    // Kontrola, zda organizace existuje
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Základní dotaz - schválené akce nebo pokud jde o vlastníka/admina
    let query = { 
      organizerId: mongoose.Types.ObjectId(organizationId),
      isApproved: true 
    };
    
    // Pokud je přihlášený uživatel vlastníkem organizace nebo admin, může vidět i neschválené akce
    if (req.user) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user && (user._id.toString() === organization.createdBy.toString() || user.role === 'admin')) {
        query = { organizerId: mongoose.Types.ObjectId(organizationId) };
      }
    }
    
    const total = await Event.countDocuments(query);
    
    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('organizerId', 'name logo');
    
    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching organization events:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Vytvoření nové organizace
exports.createOrganization = async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      contactEmail,
      contactPhone,
      website,
      address,
      socialMedia
    } = req.body;
    
    // Uživatel musí být přihlášen
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Najít uživatele v databázi
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Kontrola, zda uživatel již nemá organizaci
    const existingOrg = await Organization.findOne({ createdBy: user._id });
    if (existingOrg) {
      return res.status(400).json({ error: 'User already has an organization' });
    }
    
    // Vytvoření nové organizace
    const newOrganization = new Organization({
      name,
      description,
      logo,
      contactEmail,
      contactPhone,
      website,
      address,
      socialMedia,
      createdBy: user._id,
      isApproved: user.role === 'admin', // Admin organizace jsou automaticky schváleny
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newOrganization.save();
    
    // Aktualizace uživatele
    user.role = 'organization';
    user.organizationId = newOrganization._id;
    user.isApproved = user.role === 'admin';
    await user.save();
    
    res.status(201).json(newOrganization);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Aktualizace organizace
exports.updateOrganization = async (req, res) => {
  try {
    const organizationId = req.params.id;
    const updateData = req.body;
    
    // Kontrola, zda organizace existuje
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Kontrola oprávnění
    const user = req.dbUser;
    if (user.role !== 'admin' && organization.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this organization' });
    }
    
    // Admin může měnit všechna pole, vlastník některá
    const allowedFields = user.role === 'admin' 
      ? Object.keys(updateData) 
      : ['name', 'description', 'logo', 'contactEmail', 'contactPhone', 'website', 'address', 'socialMedia'];
    
    const filteredUpdate = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    });
    
    // Aktualizace data
    filteredUpdate.updatedAt = new Date();
    
    // Pokud není admin, nastavíme isApproved na false
    if (user.role !== 'admin') {
      filteredUpdate.isApproved = false;
    }
    
    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: filteredUpdate },
      { new: true }
    );
    
    res.json(updatedOrganization);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
