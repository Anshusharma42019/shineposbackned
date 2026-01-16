const express = require("express");
const { body, param } = require("express-validator");
const { activityLogger } = require('../middleware/activityLogger');
const {
  getOrders,
  createOrder,
  updateOrderStatus,
  processPayment,
} = require("../controllers/orderController");
const auth = require("../middleware/auth");
const TenantModelFactory = require("../models/TenantModelFactory");

const router = express.Router();

/* =====================================================
   CREATE ORDER (STAFF)
===================================================== */
router.post(
  "/add/staff",
  auth(["RESTAURANT_ADMIN", "MANAGER", "CHEF", "WAITER", "CASHIER"]),
  activityLogger('Order'),
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Items are required"),

    body("items.*.menuId")
      .notEmpty()
      .withMessage("Menu ID is required"),

    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),

    body("customerName")
      .trim()
      .notEmpty()
      .withMessage("Customer name is required"),

    body("customerPhone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),
  ],
  createOrder
);

/* =====================================================
   AUTH FOR ALL BELOW ROUTES
===================================================== */
router.use(
  auth(["RESTAURANT_ADMIN", "MANAGER", "CHEF", "WAITER", "CASHIER"])
);

/* =====================================================
   GET ALL ORDERS
===================================================== */
router.get("/all/orders", activityLogger('Order'), getOrders);

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
router.patch(
  "/update/status/:id",
  activityLogger('Order'),
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid order ID"),

    body("status")
      .isIn([
        "PENDING",
        "ORDER_ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "COMPLETE",
        "CANCELLED",
      ])
      .withMessage("Invalid order status"),
  ],
  updateOrderStatus
);

/* =====================================================
   UPDATE ORDER PRIORITY
===================================================== */
router.patch(
  "/update/priority/:id",
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid order ID"),

    body("priority")
      .isIn(["LOW", "NORMAL", "HIGH", "URGENT"])
      .withMessage("Invalid priority"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      const OrderModel = TenantModelFactory.getOrderModel(req.user.restaurantSlug);
      const KOTModel = TenantModelFactory.getKOTModel(req.user.restaurantSlug);
      
      const order = await OrderModel.findByIdAndUpdate(
        id,
        { priority },
        { new: true }
      );
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Sync priority with associated KOTs
      await KOTModel.updateMany(
        { orderId: id },
        { priority }
      );
      
      res.json({
        message: "Order priority updated successfully",
        order
      });
    } catch (error) {
      console.error("Update order priority error:", error);
      res.status(500).json({ error: "Failed to update order priority" });
    }
  }
);

/* =====================================================
   PROCESS PAYMENT
===================================================== */
router.patch(
  "/payment/:id",
  activityLogger('Payment'),
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid order ID"),

    body("method")
      .isIn(["CASH", "CARD", "UPI", "ONLINE"])
      .withMessage("Invalid payment method"),

    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Invalid payment amount"),

    body("transactionId")
      .optional()
      .isString(),
  ],
  processPayment
);

/* =====================================================
   GET KOT DATA
===================================================== */
router.get(
  "/kot/:id",
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid order ID"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const OrderModel = TenantModelFactory.getOrderModel(req.user.restaurantSlug);
      const Restaurant = require("../models/Restaurant");
      
      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const restaurant = await Restaurant.findOne({ slug: req.user.restaurantSlug });
      
      const kotData = {
        restaurantName: restaurant?.name || 'Restaurant',
        restaurantSlug: req.user.restaurantSlug,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          variation: item.variation,
          addons: item.addons || [],
          notes: item.notes
        })),
        createdAt: order.createdAt,
        status: order.status
      };
      
      res.json({ kot: kotData });
    } catch (error) {
      console.error("Get KOT error:", error);
      res.status(500).json({ error: "Failed to get KOT data" });
    }
  }
);

/* =====================================================
   PRINT KOT
===================================================== */
router.post(
  "/print-kot/:id",
  [
    param("id")
      .isMongoId()
      .withMessage("Invalid order ID"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const kotPrinter = require("../utils/kotPrinter");
      
      const OrderModel = TenantModelFactory.getOrderModel(req.user.restaurantSlug);
      const Restaurant = require("../models/Restaurant");
      
      const order = await OrderModel.findById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const restaurant = await Restaurant.findOne({ slug: req.user.restaurantSlug });
      
      const kotData = {
        restaurantName: restaurant?.name || 'Restaurant',
        orderNumber: order.orderNumber,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          addons: item.addons || []
        })),
        createdAt: order.createdAt
      };
      
      const result = await kotPrinter.printKOT(kotData);
      
      if (result.success) {
        res.json({ message: "KOT printed successfully" });
      } else {
        res.status(500).json({ error: "Failed to print KOT", details: result.error });
      }
    } catch (error) {
      console.error("Print KOT error:", error);
      res.status(500).json({ error: "Failed to print KOT" });
    }
  }
);

module.exports = router;
