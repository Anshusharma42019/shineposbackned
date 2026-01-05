const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const Restaurant = require('../models/Restaurant');
const Subscription = require('../models/Subscription');
const TenantModelFactory = require('../models/TenantModelFactory');
const { generateToken } = require('../utils/jwt');

const createRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, phone, restaurantPhone, pinCode, city, state, address, password, subscriptionPlan } = req.body;
    
    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      return res.status(400).json({ error: 'Restaurant with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', 10);

    // Set plan limits based on subscription
    let planLimits = { maxItems: 50, maxOrders: 100, maxUsers: 2 };
    if (subscriptionPlan === 'basic') {
      planLimits = { maxItems: 200, maxOrders: 500, maxUsers: 5 };
    } else if (subscriptionPlan === 'premium') {
      planLimits = { maxItems: 1000, maxOrders: 2000, maxUsers: 20 };
    }

    // Create restaurant
    const restaurant = new Restaurant({ 
      name, 
      email, 
      phone,
      restaurantPhone,
      pinCode,
      city,
      state,
      address,
      password: hashedPassword,
      subscriptionPlan: subscriptionPlan || 'trial',
      planLimits
    });
    await restaurant.save();

    res.status(201).json({
      message: 'Restaurant registered successfully',
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        restaurantPhone: restaurant.restaurantPhone,
        pinCode: restaurant.pinCode,
        city: restaurant.city,
        state: restaurant.state,
        address: restaurant.address,
        subscriptionPlan: restaurant.subscriptionPlan,
        planLimits: restaurant.planLimits,
        trialInfo: restaurant.trialInfo,
        isActive: restaurant.isActive
      }
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to register restaurant' });
  }
};

const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

const getRestaurantAnalytics = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    const analytics = [];

    for (const restaurant of restaurants) {
      try {
        const OrderModel = TenantModelFactory.getOrderModel(restaurant.slug);
        const MenuModel = TenantModelFactory.getMenuModel(restaurant.slug);
        
        const totalOrders = await OrderModel.countDocuments();
        const totalRevenue = await OrderModel.aggregate([
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const menuCount = await MenuModel.countDocuments();
        
        analytics.push({
          restaurantId: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          isActive: restaurant.isActive,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          menuCount
        });
      } catch (err) {
        analytics.push({
          restaurantId: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          isActive: restaurant.isActive,
          totalOrders: 0,
          totalRevenue: 0,
          menuCount: 0
        });
      }
    }

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const restaurant = await Restaurant.findByIdAndUpdate(
      id, 
      { name }, 
      { new: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant updated successfully', restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findByIdAndDelete(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
};

const toggleRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.json({
      message: `Restaurant ${restaurant.isActive ? 'enabled' : 'disabled'} successfully`,
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        slug: restaurant.slug,
        isActive: restaurant.isActive
      }
    });
  } catch (error) {
    console.error('Toggle restaurant status error:', error);
    res.status(500).json({ error: 'Failed to update restaurant status' });
  }
};

module.exports = {
  createRestaurant,
  getRestaurants,
  getRestaurantAnalytics,
  updateRestaurant,
  deleteRestaurant,
  toggleRestaurantStatus
};