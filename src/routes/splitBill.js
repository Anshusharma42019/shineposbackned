const express = require('express');
const { body, param } = require('express-validator');
const { splitBill, splitBillEqually, processSplitPayment, getSplitBill } = require('../controllers/splitBillController');
const auth = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

const router = express.Router();

router.use(auth(['RESTAURANT_ADMIN', 'MANAGER', 'WAITER', 'CASHIER']), checkSubscription);

// Split bill by items
router.post('/split/:orderId', [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('splits').isArray({ min: 2 }).withMessage('At least 2 splits required'),
  body('splits.*.items').isArray({ min: 1 }).withMessage('Each split must have items')
], splitBill);

// Split bill equally
router.post('/split-equally/:orderId', [
  param('orderId').isMongoId().withMessage('Invalid order ID'),
  body('numberOfSplits').isInt({ min: 2, max: 10 }).withMessage('Number of splits must be between 2 and 10')
], splitBillEqually);

// Process payment for a split
router.post('/payment/:splitBillId/:splitNumber', [
  param('splitBillId').isMongoId().withMessage('Invalid split bill ID'),
  param('splitNumber').isInt({ min: 1 }).withMessage('Invalid split number'),
  body('method').isIn(['CASH', 'CARD', 'UPI', 'ONLINE']).withMessage('Invalid payment method')
], processSplitPayment);

// Get split bill
router.get('/:orderId', [
  param('orderId').isMongoId().withMessage('Invalid order ID')
], getSplitBill);

module.exports = router;
