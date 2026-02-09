const TenantModelFactory = require('../models/TenantModelFactory');
const { validationResult } = require('express-validator');

// Split bill by items
exports.splitBill = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { splits } = req.body; // Array of { items: [{menuId, quantity}], customerName }
    const { restaurantSlug } = req.user;

    const Order = TenantModelFactory.getModel(restaurantSlug, 'Order');
    const SplitBill = TenantModelFactory.getModel(restaurantSlug, 'SplitBill');

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'COMPLETE') {
      return res.status(400).json({ error: 'Order already completed' });
    }

    // Calculate total including extraItems
    const orderSubtotal = order.subtotal || (order.items.reduce((sum, item) => sum + item.itemTotal, 0) + 
      (order.extraItems || []).reduce((sum, item) => sum + item.total, 0));

    // Calculate split bills
    const splitBills = splits.map((split, index) => {
      let subtotal = 0;
      const splitItems = split.items.map(item => {
        const orderItem = order.items.find(oi => oi.menuId.toString() === item.menuId);
        if (!orderItem) throw new Error(`Item ${item.menuId} not found in order`);
        
        const itemTotal = (orderItem.itemTotal / orderItem.quantity) * item.quantity;
        subtotal += itemTotal;

        return {
          menuId: orderItem.menuId,
          name: orderItem.name,
          quantity: item.quantity,
          itemTotal
        };
      });

      const gst = (subtotal * (order.gst / orderSubtotal)) || 0;
      const sgst = (subtotal * (order.sgst / orderSubtotal)) || 0;
      const totalAmount = subtotal + gst + sgst;

      return {
        splitNumber: index + 1,
        items: splitItems,
        subtotal,
        gst,
        sgst,
        totalAmount,
        customerName: split.customerName || `Split ${index + 1}`
      };
    });

    const splitBill = await SplitBill.create({
      originalOrderId: orderId,
      splits: splitBills
    });

    // Mark order as having split bill with summary
    const splitSummary = splitBills.map(split => ({
      splitNumber: split.splitNumber,
      customerName: split.customerName,
      totalAmount: split.totalAmount,
      paymentStatus: 'PENDING'
    }));

    await Order.findByIdAndUpdate(orderId, {
      hasSplitBill: true,
      splitBillId: splitBill._id,
      splitBillSummary: splitSummary
    });

    res.json({ success: true, splitBill });
  } catch (error) {
    console.error('Split bill error:', error);
    res.status(500).json({ error: error.message || 'Failed to split bill' });
  }
};

// Split bill equally
exports.splitBillEqually = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { numberOfSplits } = req.body;
    const { restaurantSlug } = req.user;

    const Order = TenantModelFactory.getModel(restaurantSlug, 'Order');
    const SplitBill = TenantModelFactory.getModel(restaurantSlug, 'SplitBill');

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const amountPerSplit = order.totalAmount / numberOfSplits;
    const subtotalPerSplit = order.subtotal / numberOfSplits;
    const gstPerSplit = order.gst / numberOfSplits;
    const sgstPerSplit = order.sgst / numberOfSplits;

    const splits = Array.from({ length: numberOfSplits }, (_, i) => ({
      splitNumber: i + 1,
      items: [],
      subtotal: subtotalPerSplit,
      gst: gstPerSplit,
      sgst: sgstPerSplit,
      totalAmount: amountPerSplit,
      customerName: `Split ${i + 1}`
    }));

    const splitBill = await SplitBill.create({
      originalOrderId: orderId,
      splits
    });

    // Mark order as having split bill with summary
    const splitSummary = splits.map(split => ({
      splitNumber: split.splitNumber,
      customerName: split.customerName,
      totalAmount: split.totalAmount,
      paymentStatus: 'PENDING'
    }));

    await Order.findByIdAndUpdate(orderId, {
      hasSplitBill: true,
      splitBillId: splitBill._id,
      splitBillSummary: splitSummary
    });

    res.json({ success: true, splitBill });
  } catch (error) {
    console.error('Split bill equally error:', error);
    res.status(500).json({ error: 'Failed to split bill equally' });
  }
};

// Process payment for a split
exports.processSplitPayment = async (req, res) => {
  try {
    const { splitBillId, splitNumber } = req.params;
    const { method, transactionId } = req.body;
    const { restaurantSlug } = req.user;

    const SplitBill = TenantModelFactory.getModel(restaurantSlug, 'SplitBill');

    const splitBill = await SplitBill.findById(splitBillId);
    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    const split = splitBill.splits.find(s => s.splitNumber === parseInt(splitNumber));
    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    split.paymentStatus = 'PAID';
    split.paymentDetails = {
      method,
      transactionId,
      paidAt: new Date()
    };

    // Update order's split summary
    const Order = TenantModelFactory.getModel(restaurantSlug, 'Order');
    const order = await Order.findById(splitBill.originalOrderId);
    
    if (order && order.splitBillSummary) {
      const summaryIndex = order.splitBillSummary.findIndex(s => s.splitNumber === parseInt(splitNumber));
      if (summaryIndex !== -1) {
        order.splitBillSummary[summaryIndex].paymentStatus = 'PAID';
        order.splitBillSummary[summaryIndex].paymentMethod = method;
        order.splitBillSummary[summaryIndex].paidAt = new Date();
      }
    }

    // Check if all splits are paid
    const allPaid = splitBill.splits.every(s => s.paymentStatus === 'PAID');
    if (allPaid) {
      splitBill.status = 'COMPLETED';
      
      // Update original order
      await Order.findByIdAndUpdate(splitBill.originalOrderId, {
        status: 'PAID',
        'paymentDetails.method': 'SPLIT_BILL',
        'paymentDetails.amount': splitBill.splits.reduce((sum, s) => sum + s.totalAmount, 0),
        'paymentDetails.paidAt': new Date(),
        splitBillSummary: order.splitBillSummary
      });
    } else {
      await order.save();
    }

    await splitBill.save();

    res.json({ success: true, splitBill, allPaid });
  } catch (error) {
    console.error('Process split payment error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

// Get split bill details
exports.getSplitBill = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { restaurantSlug } = req.user;

    const SplitBill = TenantModelFactory.getModel(restaurantSlug, 'SplitBill');

    const splitBill = await SplitBill.findOne({ originalOrderId: orderId });

    if (!splitBill) {
      return res.status(404).json({ error: 'Split bill not found' });
    }

    res.json({ success: true, splitBill });
  } catch (error) {
    console.error('Get split bill error:', error);
    res.status(500).json({ error: 'Failed to get split bill' });
  }
};
