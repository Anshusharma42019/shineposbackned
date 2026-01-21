const TenantModelFactory = require('../models/TenantModelFactory');

const fixExtraItemsField = async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantSlug = req.user?.restaurantSlug;
    
    if (!restaurantSlug) {
      return res.status(400).json({ error: "Restaurant slug not found" });
    }

    const OrderModel = TenantModelFactory.getOrderModel(restaurantSlug);
    
    // Find and update the specific order
    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { $set: { extraItems: [] } },
      { new: true, upsert: false }
    );
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    console.log('Fixed extraItems field for order:', order.orderNumber);
    
    res.json({
      message: "ExtraItems field fixed successfully",
      order
    });
  } catch (error) {
    console.error("Fix extraItems error:", error);
    res.status(500).json({ error: "Failed to fix extraItems field" });
  }
};

module.exports = { fixExtraItemsField };