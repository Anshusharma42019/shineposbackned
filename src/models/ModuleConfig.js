const mongoose = require('mongoose');

const moduleConfigSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    unique: true
  },
  modules: {
    inventory: {
      enabled: { type: Boolean, default: true },
      updatedAt: Date,
      updatedBy: mongoose.Schema.Types.ObjectId
    },
    orderTaking: {
      enabled: { type: Boolean, default: true },
      updatedAt: Date,
      updatedBy: mongoose.Schema.Types.ObjectId
    },
    kot: {
      enabled: { type: Boolean, default: true },
      updatedAt: Date,
      updatedBy: mongoose.Schema.Types.ObjectId
    },
    gst: {
      enabled: { type: Boolean, default: true },
      updatedAt: Date,
      updatedBy: mongoose.Schema.Types.ObjectId
    }
  }
}, {
  timestamps: true
});

// Index for fast lookup
moduleConfigSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('ModuleConfig', moduleConfigSchema);
