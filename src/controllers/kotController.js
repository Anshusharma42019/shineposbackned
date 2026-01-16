const TenantModelFactory = require('../models/TenantModelFactory');
const kotPrinter = require('../utils/kotPrinter');

// Create KOT from order
const createKOT = async (req, res) => {
  try {
    const { orderId, items, tableNumber, notes, priority } = req.body;
    const restaurantSlug = req.user.restaurantSlug;
    
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    const OrderModel = TenantModelFactory.getOrderModel(restaurantSlug);
    
    // Get order details
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Create KOT
    const kot = new KOTModel({
      orderId,
      orderNumber: order.orderNumber,
      items: items || order.items,
      tableNumber,
      customerName: order.customerName,
      priority: priority || 'NORMAL',
      notes,
      printedAt: new Date()
    });
    
    await kot.save();
    
    res.status(201).json({
      message: 'KOT created successfully',
      kot
    });
  } catch (error) {
    console.error('Create KOT error:', error);
    res.status(500).json({ error: 'Failed to create KOT' });
  }
};

// Get all KOTs
const getKOTs = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    const kots = await KOTModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('orderId');
    
    res.json({ kots });
  } catch (error) {
    console.error('Get KOTs error:', error);
    res.status(500).json({ error: 'Failed to fetch KOTs' });
  }
};

// Get KOT by ID
const getKOTById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const kot = await KOTModel.findById(id).populate('orderId');
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json({ kot });
  } catch (error) {
    console.error('Get KOT by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch KOT' });
  }
};
// Update KOT status
const updateKOTStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const updateData = { status };
    
    // Add timestamps based on status
    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      
      // Calculate actual time if started
      const kot = await KOTModel.findById(id);
      if (kot && kot.startedAt) {
        const timeDiff = (new Date() - kot.startedAt) / (1000 * 60); // in minutes
        updateData.actualTime = Math.round(timeDiff);
      }
    }
    
    const kot = await KOTModel.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json({
      message: 'KOT status updated successfully',
      kot
    });
  } catch (error) {
    console.error('Update KOT status error:', error);
    res.status(500).json({ error: 'Failed to update KOT status' });
  }
};

// Update KOT priority
const updateKOTPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const kot = await KOTModel.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    );
    
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json({
      message: 'KOT priority updated successfully',
      kot
    });
  } catch (error) {
    console.error('Update KOT priority error:', error);
    res.status(500).json({ error: 'Failed to update KOT priority' });
  }
};

// Print KOT
const printKOT = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const kot = await KOTModel.findById(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    // Prepare data for printing
    const printData = {
      restaurantName: req.user.restaurantName || 'Restaurant',
      orderNumber: kot.orderNumber,
      kotNumber: kot.kotNumber,
      items: kot.items,
      tableNumber: kot.tableNumber,
      customerName: kot.customerName,
      priority: kot.priority,
      notes: kot.notes,
      createdAt: kot.createdAt
    };
    
    // Print KOT
    const printResult = await kotPrinter.printKOT(printData);
    
    if (printResult.success) {
      // Update printed timestamp
      await KOTModel.findByIdAndUpdate(id, { printedAt: new Date() });
      
      res.json({
        message: 'KOT printed successfully',
        printResult
      });
    } else {
      res.status(500).json({
        error: 'Failed to print KOT',
        details: printResult.error
      });
    }
  } catch (error) {
    console.error('Print KOT error:', error);
    res.status(500).json({ error: 'Failed to print KOT' });
  }
};

// Get kitchen dashboard data
const getKitchenDashboard = async (req, res) => {
  try {
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const [pendingKOTs, inProgressKOTs, completedToday] = await Promise.all([
      KOTModel.countDocuments({ status: 'PENDING' }),
      KOTModel.countDocuments({ status: 'IN_PROGRESS' }),
      KOTModel.countDocuments({
        status: 'COMPLETED',
        completedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);
    
    const recentKOTs = await KOTModel.find({
      status: { $in: ['PENDING', 'IN_PROGRESS'] }
    })
    .sort({ priority: -1, createdAt: 1 })
    .limit(10);
    
    res.json({
      dashboard: {
        pendingKOTs,
        inProgressKOTs,
        completedToday,
        recentKOTs
      }
    });
  } catch (error) {
    console.error('Get kitchen dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen dashboard data' });
  }
};

// Delete KOT
const deleteKOT = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantSlug = req.user.restaurantSlug;
    const KOTModel = TenantModelFactory.getKOTModel(restaurantSlug);
    
    const kot = await KOTModel.findByIdAndDelete(id);
    if (!kot) {
      return res.status(404).json({ error: 'KOT not found' });
    }
    
    res.json({ message: 'KOT deleted successfully' });
  } catch (error) {
    console.error('Delete KOT error:', error);
    res.status(500).json({ error: 'Failed to delete KOT' });
  }
};

module.exports = {
  createKOT,
  getKOTs,
  getKOTById,
  updateKOTStatus,
  updateKOTPriority,
  printKOT,
  getKitchenDashboard,
  deleteKOT
};