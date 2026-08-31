const express = require('express');

// Controllers
const { 
    createVisitor, 
    getVisitors, 
    getVisitor, 
    updateVisitor, 
    deleteVisitor 
} = require('../controllers/visitorController');

// Middlewares
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// 1. Any authenticated user can create/read
router.post('/', requireAuth, createVisitor);
router.get('/', requireAuth, getVisitors);
router.get('/:id', requireAuth, getVisitor);

// 2. ONLY Admin can update/delete
router.patch('/:id', requireAuth, requireAdmin, updateVisitor);
router.delete('/:id', requireAuth, requireAdmin, deleteVisitor);

module.exports = router;