const express = require('express');
const router = express.Router();
const TenantModelFactory = require('../models/TenantModelFactory');

// Zomato Order History Webhook - Dyno fetches order history via POST
router.post('/:restaurantId/orders/history', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.body; // Expected format: 'YYYY-MM-DD' or '28-01-2026'

    // Find restaurant by ID or slug
    const Restaurant = require('../models/Restaurant');
    let restaurant;
    
    if (restaurantId.match(/^[0-9a-fA-F]{24}$/)) {
      restaurant = await Restaurant.findById(restaurantId);
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantId });
    }
    
    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        error: 'Restaurant not found'
      });
    }

    // Get Order model for this restaurant
    const OrderModel = TenantModelFactory.getOrderModel(restaurant.slug);

    // Build query
    const query = { source: 'ZOMATO' };
    
    // Add date filter if provided
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // Fetch orders
    const orders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      restaurant: restaurant.name,
      date: date || 'all',
      totalOrders: orders.length,
      orders: orders.map(order => ({
        order_id: order.orderNumber,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        items: order.items,
        total_amount: order.totalAmount,
        status: order.status,
        payment_method: order.paymentMethod,
        created_at: order.createdAt,
        metadata: order.metadata
      }))
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order history',
      message: error.message
    });
  }
});

// Test endpoint to verify webhook is working
router.get('/:restaurantId/orders/history', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is active',
    restaurantId: req.params.restaurantId,
    method: 'Use POST to fetch order history',
    endpoint: `POST /api/webhooks/${req.params.restaurantId}/orders/history`,
    expectedPayload: {
      date: '2026-01-28 (optional, format: YYYY-MM-DD)'
    },
    example: {
      date: '2026-01-28'
    }
  });
});

router.get('/:restaurantId/orders/history/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is active',
    restaurantId: req.params.restaurantId,
    endpoint: `POST /${req.params.restaurantId}/orders/history`,
    expectedPayload: {
      order_id: 'string',
      customer_name: 'string',
      customer_phone: 'string',
      items: [
        {
          name: 'string',
          quantity: 'number',
          price: 'number'
        }
      ],
      total_amount: 'number',
      status: 'PENDING | CONFIRMED | PREPARING | READY | DELIVERED',
      payment_method: 'CASH | ONLINE | CARD',
      delivery_address: 'string',
      special_instructions: 'string'
    }
  });
});

module.exports = router;
