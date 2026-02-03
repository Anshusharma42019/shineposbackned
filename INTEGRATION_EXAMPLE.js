// Example: How to integrate into existing routes

const { checkModule, isModuleEnabled } = require('../middleware/moduleCheck');

// ============================================
// EXAMPLE 1: Protect entire route
// ============================================
router.post('/orders', 
  authenticate, 
  checkModule('orderTaking'),  // Add this line
  async (req, res) => {
    // Existing order creation logic
  }
);

// ============================================
// EXAMPLE 2: Conditional inventory deduction
// ============================================
router.post('/orders', authenticate, async (req, res) => {
  try {
    // Existing order creation logic
    const order = await createOrder(req.body);

    // NEW: Only deduct inventory if module is enabled
    const inventoryEnabled = await isModuleEnabled(
      req.user.restaurantId, 
      'inventory'
    );
    
    if (inventoryEnabled) {
      await deductInventory(order.items);
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE 3: Protect KOT routes
// ============================================
router.post('/kot', 
  authenticate, 
  checkModule('kot'),  // Add this line
  async (req, res) => {
    // Existing KOT logic
  }
);

// ============================================
// EXAMPLE 4: Protect inventory routes
// ============================================
router.get('/inventory', 
  authenticate, 
  checkModule('inventory'),  // Add this line
  async (req, res) => {
    // Existing inventory logic
  }
);

router.post('/inventory', 
  authenticate, 
  checkModule('inventory'),
  async (req, res) => {
    // Existing inventory creation logic
  }
);

router.put('/inventory/:id', 
  authenticate, 
  checkModule('inventory'),
  async (req, res) => {
    // Existing inventory update logic
  }
);
