const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  paymentTerms: {
    type: String
  },
  deliveryTime: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const vendorPriceSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderQty: {
    type: Number,
    default: 1
  },
  validUntil: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = { vendorSchema, vendorPriceSchema };