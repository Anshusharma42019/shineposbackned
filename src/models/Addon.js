const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    default: 'general'
  },
  veg: {
    type: Boolean,
    default: true
  },
  available: {
    type: Boolean,
    default: true
  }
});

const Addon = mongoose.models.addon || mongoose.model('addon', addonSchema);
module.exports = Addon;