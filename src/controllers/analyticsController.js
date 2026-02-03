const Restaurant = require('../models/Restaurant');
const TenantModelFactory = require('../models/TenantModelFactory');

const getAdvancedAnalytics = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    const analytics = {
      totalRevenue: 0,
      totalOrders: 0,
      restaurantPerformance: [],
      peakHours: {},
      revenueByDay: [],
      topPerformingRestaurants: []
    };

    for (const restaurant of restaurants) {
      try {
        const OrderModel = TenantModelFactory.getOrderModel(restaurant.slug);
        
        // Get orders from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await OrderModel.find({
          createdAt: { $gte: thirtyDaysAgo }
        });

        const restaurantRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const restaurantOrders = orders.length;

        analytics.totalRevenue += restaurantRevenue;
        analytics.totalOrders += restaurantOrders;

        // Peak hours analysis
        const hourlyOrders = {};
        orders.forEach(order => {
          const hour = new Date(order.createdAt).getHours();
          hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
        });

        // Daily revenue
        const dailyRevenue = {};
        orders.forEach(order => {
          const day = new Date(order.createdAt).toDateString();
          dailyRevenue[day] = (dailyRevenue[day] || 0) + order.totalAmount;
        });

        analytics.restaurantPerformance.push({
          restaurantId: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          revenue: restaurantRevenue,
          orders: restaurantOrders,
          averageOrderValue: restaurantOrders > 0 ? restaurantRevenue / restaurantOrders : 0,
          peakHour: Object.keys(hourlyOrders).reduce((a, b) => hourlyOrders[a] > hourlyOrders[b] ? a : b, '0'),
          dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }))
        });

        // Aggregate peak hours
        Object.entries(hourlyOrders).forEach(([hour, count]) => {
          analytics.peakHours[hour] = (analytics.peakHours[hour] || 0) + count;
        });

      } catch (err) {
        console.error(`Error processing restaurant ${restaurant.slug}:`, err);
      }
    }

    // Sort restaurants by performance
    analytics.topPerformingRestaurants = analytics.restaurantPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate revenue trends (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      const dayRevenue = analytics.restaurantPerformance.reduce((sum, restaurant) => {
        const dayData = restaurant.dailyRevenue.find(d => d.date === dateStr);
        return sum + (dayData ? dayData.revenue : 0);
      }, 0);
      
      last7Days.push({
        date: dateStr,
        revenue: dayRevenue
      });
    }
    analytics.revenueByDay = last7Days;

    res.json(analytics);
  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({ error: 'Failed to get advanced analytics' });
  }
};

const exportReport = async (req, res) => {
  try {
    const { format = 'json', type = 'revenue' } = req.query;
    
    // Get analytics data
    const analyticsData = await getAdvancedAnalytics(req, res);
    
    if (format === 'csv') {
      // Convert to CSV format
      let csv = 'Restaurant,Revenue,Orders,Average Order Value\n';
      analyticsData.restaurantPerformance.forEach(restaurant => {
        csv += `${restaurant.name},${restaurant.revenue},${restaurant.orders},${restaurant.averageOrderValue}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=restaurant-report.csv');
      res.send(csv);
    } else {
      res.json(analyticsData);
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};

const getSalesData = async (req, res) => {
  try {
    const restaurantSlug = req.user.restaurantSlug;
    const OrderModel = TenantModelFactory.getOrderModel(restaurantSlug);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const sales = await OrderModel.find({
      createdAt: { $gte: thirtyDaysAgo },
      status: { $in: ['DELIVERED', 'PAID'] }
    });
    
    res.json({ sales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAdvancedAnalytics,
  exportReport,
  getSalesData
};