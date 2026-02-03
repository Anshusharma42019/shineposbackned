const express = require('express');
const { getDashboardStats } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

const router = express.Router();

router.get('/stats', auth(['RESTAURANT_ADMIN', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER']), checkSubscription, getDashboardStats);

module.exports = router;
