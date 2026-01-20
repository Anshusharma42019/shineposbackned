const mongoose = require('mongoose');

const KOTSchema = new mongoose.Schema({
  kotNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  orderNumber: {
    type: String,
    required: true
  },
  
  items: [{
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variation: {
      name: String,
      price: Number
    },
    addons: [{
      name: String,
      price: Number
    }],
    specialInstructions: String,
    status: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'READY', 'SERVED'],
      default: 'PENDING'
    }
  }],
  
  status: {
    type: String,
    enum: ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
    default: 'PENDING'
  },
  
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL'
  },
  
  tableNumber: String,
  customerName: String,
  
  printedAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  estimatedTime: Number, // in minutes
  actualTime: Number, // in minutes
  
  notes: String
}, {
  timestamps: true
});

// Generate KOT number
KOTSchema.pre('save', async function(next) {
  if (!this.kotNumber) {
    const count = await this.constructor.countDocuments();
    this.kotNumber = `KOT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('KOT', KOTSchema);