const TenantModelFactory = require('../models/TenantModelFactory');

const getDashboardStats = async (req, res) => {
  try {
    const restaurantSlug = req.user?.restaurantSlug;
    if (!restaurantSlug) {
      return res.status(400).json({ error: 'Restaurant slug not found' });
    }

    const { filter = 'today' } = req.query;

    const OrderModel = TenantModelFactory.getOrderModel(restaurantSlug);
    const MenuModel = TenantModelFactory.getMenuItemModel(restaurantSlug);
    const StaffModel = TenantModelFactory.getStaffModel(restaurantSlug);

    // Calculate date range based on filter
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (filter === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (filter === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Fetch data
    const [allOrders, filteredOrders, menuItems, staff] = await Promise.all([
      OrderModel.find().lean(),
      OrderModel.find({ createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      MenuModel.countDocuments(),
      StaffModel.countDocuments({ isActive: true })
    ]);

    // Calculate stats
    const revenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = filteredOrders.length > 0 ? revenue / filteredOrders.length : 0;
    const pendingOrders = allOrders.filter(o => o.status === 'PENDING').length;
    const completedOrders = allOrders.filter(o => o.status === 'PAID' || o.status === 'COMPLETE').length;

    // Recent orders (last 10)
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        items: order.items || [],
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }));

    res.json({
      success: true,
      filter,
      stats: {
        orders: filteredOrders.length,
        revenue,
        avgOrderValue,
        totalMenuItems: menuItems,
        activeStaff: staff,
        pendingOrders,
        completedOrders,
        customerSatisfaction: 4.8
      },
      recentOrders
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

module.exports = {
  getDashboardStats
};
