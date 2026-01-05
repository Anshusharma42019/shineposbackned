const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  restaurantPhone: {
    type: String,
    required: true
  },
  pinCode: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['trial', 'basic', 'premium'],
    default: 'trial'
  },
  trialInfo: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    isExpired: {
      type: Boolean,
      default: false
    }
  },
  planLimits: {
    maxItems: {
      type: Number,
      default: 50
    },
    maxOrders: {
      type: Number,
      default: 100
    },
    maxUsers: {
      type: Number,
      default: 2
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);