const mongoose = require('mongoose');

const SplitBillSchema = new mongoose.Schema({
  originalOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  splits: [{
    splitNumber: { type: Number, required: true },
    items: [{
      menuId: mongoose.Schema.Types.ObjectId,
      name: String,
      quantity: Number,
      itemTotal: Number
    }],
    subtotal: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING'
    },
    paymentDetails: {
      method: { type: String, enum: ['CASH', 'CARD', 'UPI', 'ONLINE'] },
      transactionId: String,
      paidAt: Date
    },
    customerName: String
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

module.exports = mongoose.model('SplitBill', SplitBillSchema);
