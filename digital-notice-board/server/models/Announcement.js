const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  duration: {
    type: Number,
    default: 7,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'mixed'],
    default: 'text'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + this.duration);
      return date;
    }
  }
});

module.exports = mongoose.model('Announcement', announcementSchema);