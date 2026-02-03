const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: ['Expired', 'Spoiled', 'Overcooked', 'Customer Return', 'Preparation Error', 'Equipment Failure', 'Other']
  },
  date: {
    type: Date,
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = wastageSchema;