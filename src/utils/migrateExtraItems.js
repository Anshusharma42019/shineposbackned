const TenantModelFactory = require('../models/TenantModelFactory');
const Restaurant = require('../models/Restaurant');

const migrateExtraItems = async () => {
  try {
    console.log('Starting extraItems migration...');
    
    // Get all restaurants
    const restaurants = await Restaurant.find({ isActive: true });
    
    for (const restaurant of restaurants) {
      console.log(`Migrating orders for restaurant: ${restaurant.slug}`);
      
      const OrderModel = TenantModelFactory.getOrderModel(restaurant.slug);
      
      // Update all orders that don't have extraItems field
      const result = await OrderModel.updateMany(
        { extraItems: { $exists: false } },
        { $set: { extraItems: [] } }
      );
      
      console.log(`Updated ${result.modifiedCount} orders for ${restaurant.slug}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

module.exports = { migrateExtraItems };