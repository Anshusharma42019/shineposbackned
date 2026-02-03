const express = require('express');
const router = express.Router();
const ModuleConfig = require('../models/ModuleConfig');
const Restaurant = require('../models/Restaurant');
const { clearModuleCache } = require('../middleware/moduleCheck');
const auth = require('../middleware/auth');

// Get module configuration
router.get('/config', auth(), async (req, res) => {
  try {
    const restaurantSlug = req.user.restaurantSlug;
    
    if (!restaurantSlug) {
      return res.status(400).json({ error: 'Restaurant slug not found in token' });
    }

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    let config = await ModuleConfig.findOne({ restaurantId: restaurant._id });
    
    if (!config) {
      config = await ModuleConfig.create({
        restaurantId: restaurant._id,
        modules: {
          inventory: { enabled: true },
          orderTaking: { enabled: true },
          kot: { enabled: true },
          gst: { enabled: true }
        }
      });
    }

    res.json({ success: true, modules: config.modules });
  } catch (error) {
    console.error('Get module config error:', error);
    res.status(500).json({ error: 'Failed to get module configuration' });
  }
});

// Update module configuration (Owner/Admin only)
router.put('/config', auth(), async (req, res) => {
  try {
    const { role, restaurantSlug, _id: userId } = req.user;
    const { moduleName, enabled } = req.body;

    if (!restaurantSlug) {
      return res.status(400).json({ error: 'Restaurant slug not found in token' });
    }

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Only owner/admin can change modules
    if (role !== 'RESTAURANT_ADMIN' && role !== 'MANAGER') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const validModules = ['inventory', 'orderTaking', 'kot', 'gst'];
    if (!validModules.includes(moduleName)) {
      return res.status(400).json({ error: 'Invalid module name' });
    }

    // Find or create config
    let config = await ModuleConfig.findOne({ restaurantId: restaurant._id });
    
    if (!config) {
      config = await ModuleConfig.create({
        restaurantId: restaurant._id,
        modules: {
          inventory: { enabled: true },
          orderTaking: { enabled: true },
          kot: { enabled: true },
          gst: { enabled: true }
        }
      });
    }

    // Update the specific module
    config.modules[moduleName].enabled = enabled;
    config.modules[moduleName].updatedAt = new Date();
    config.modules[moduleName].updatedBy = userId;
    
    await config.save();

    clearModuleCache(restaurant._id);

    res.json({ 
      success: true, 
      message: `${moduleName} module ${enabled ? 'enabled' : 'disabled'}`,
      modules: config.modules 
    });
  } catch (error) {
    console.error('Update module config error:', error);
    res.status(500).json({ error: 'Failed to update module configuration' });
  }
});

module.exports = router;
