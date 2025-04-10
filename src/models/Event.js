// src/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    name: String,
    address: String,
    city: {
      type: String,
      required: true
    },
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'workshop', 
      'conference', 
      'lecture', 
      'competition', 
      'internship', 
      'course',
      'hackathon',
      'exhibition',
      'other'
    ]
  },
  ageRange: {
    min: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    max: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  registrationUrl: String,
  price: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'CZK'
    },
    isFree: {
      type: Boolean,
      default: true
    }
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  images: [String],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexy pro efektivní vyhledávání
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ 'ageRange.min': 1, 'ageRange.max': 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ isApproved: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
