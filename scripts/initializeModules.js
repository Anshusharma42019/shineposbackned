const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Restaurant = require('../src/models/Restaurant');
const ModuleConfig = require('../src/models/ModuleConfig');

async function initializeModulesForExistingRestaurants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const restaurants = await Restaurant.find();
    console.log(`Found ${restaurants.length} restaurants`);

    let initialized = 0;
    let skipped = 0;

    for (const restaurant of restaurants) {
      const exists = await ModuleConfig.findOne({ restaurantId: restaurant._id });
      
      if (!exists) {
        await ModuleConfig.create({
          restaurantId: restaurant._id,
          modules: {
            inventory: { enabled: true },
            orderTaking: { enabled: true },
            kot: { enabled: true }
          }
        });
        console.log(`✓ Initialized modules for: ${restaurant.restaurantName || restaurant.ownerName || 'Restaurant'} (${restaurant.slug})`);
        initialized++;
      } else {
        console.log(`- Skipped (already exists): ${restaurant.restaurantName || restaurant.ownerName || 'Restaurant'}`);
        skipped++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Initialized: ${initialized}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${restaurants.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

initializeModulesForExistingRestaurants();
