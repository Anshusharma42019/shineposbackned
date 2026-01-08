const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

const router = express.Router();

// Create Category
router.post(
    '/add',
    auth(['RESTAURANT_ADMIN']),
    tenantMiddleware,
    [
        body('name').trim().notEmpty().withMessage('Category name is required')
    ],
    createCategory
);

// Get all categories
router.get('/all', auth(['RESTAURANT_ADMIN']), tenantMiddleware, getCategories);

// Update category
router.put('/update/:id', auth(['RESTAURANT_ADMIN']), tenantMiddleware, updateCategory);

// Delete category
router.delete('/delete/:id', auth(['RESTAURANT_ADMIN']), tenantMiddleware, deleteCategory);

module.exports = router;
