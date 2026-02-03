const express = require('express');
const { getAdvancedAnalytics, exportReport, getSalesData } = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();

// Get advanced analytics
router.get('/all/advanced/analytics', auth(['SUPER_ADMIN']), getAdvancedAnalytics);

// Export reports
router.post('/add/reports/export', auth(['SUPER_ADMIN']), exportReport);

// Sales data for predictions
router.get('/sales-data', auth(['RESTAURANT_ADMIN', 'STAFF']), tenantMiddleware, getSalesData);

module.exports = router;