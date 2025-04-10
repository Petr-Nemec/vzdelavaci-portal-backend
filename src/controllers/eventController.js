// src/controllers/eventController.js - ukázka implementace
const Event = require('../models/Event');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');

// Získání seznamu akcí s filtrováním
exports.getEvents = async (req, res) => {
  try {
    const {
      city,
      startDate,
      endDate,
      eventType,
      minAge,
      maxAge,
      organizerId,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = { isApproved: true };

    // Aplikace filtrů
    if (city) {
      query['location.city'] = city;
    }

    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (minAge) {
      query['ageRange.min'] = { $lte: parseInt(minAge) };
    }

    if (maxAge) {
      query['ageRange.max'] = { $gte: parseInt(maxAge) };
    }

    if (organizerId) {
      query.organizerId = mongoose.Types.ObjectId(organizerId);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Počet akcí celkem (pro stránkování)
    const total = await Event.countDocuments(query);

    // Načtení akcí s paginací
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
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Získání detailu akce
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'name description logo contactEmail website');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Vytvoření nové akce
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      shortDescription,
      startDate,
      endDate,
      location,
      eventType,
      ageRange,
      registrationUrl,
      price,
      images,
      tags
    } = req.body;

    // Ověření, zda je uživatel součástí organizace
    const user = req.dbUser;
    if (user.role !== 'organization' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only organizations can create events' });
    }

    // Vyhledání organizace uživatele
    const organization = await Organization.findOne({ createdBy: user._id });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Automatické schválení událostí pro adminy, jinak čeká na schválení
    const isApproved = user.role === 'admin';

    const newEvent = new Event({
      title,
      description,
      shortDescription,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      eventType,
      ageRange,
      registrationUrl,
      price,
      organizerId: organization._id,
      createdBy: user._id,
      isApproved,
      images: images || [],
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Aktualizace události
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const user = req.dbUser;
    
    // Načtení události
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Ověření oprávnění (vlastník nebo admin)
    if (user.role !== 'admin' && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    
    const update = { ...req.body, updatedAt: new Date() };
    
    // Pokud není admin, jakákoliv úprava vyžaduje nové schválení
    if (user.role !== 'admin') {
      update.isApproved = false;
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: update },
      { new: true }
    );
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Smazání události
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const user = req.dbUser;
    
    // Načtení události
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Ověření oprávnění (vlastník nebo admin)
    if (user.role !== 'admin' && event.createdBy.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    await Event.findByIdAndDelete(eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Získání událostí ve formátu pro kalendář
exports.getCalendarEvents = async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { isApproved: true };
    
    if (start) {
      query.startDate = { $gte: new Date(start) };
    }
    
    if (end) {
      query.endDate = { $lte: new Date(end) };
    }
    
    const events = await Event.find(query)
      .select('title startDate endDate location eventType _id')
      .populate('organizerId', 'name');
    
    // Formátování dat pro kalendář
    const calendarEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      extendedProps: {
        location: event.location.city,
        type: event.eventType,
        organizer: event.organizerId ? event.organizerId.name : 'Neznámý organizátor'
      }
    }));
    
    res.json(calendarEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
