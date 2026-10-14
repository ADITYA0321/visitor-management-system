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
const upload = require('../middleware/upload'); // 👈 1. Apna Multer middleware import karein (path check kar lein)

const router = express.Router();

// 1. Any authenticated user can create/read
// Note: Agar createVisitor mein bhi photo upload hoti hai toh wahan bhi upload.single('photo') hoga
router.post('/', requireAuth, upload.single('photo'), createVisitor); 
router.get('/', requireAuth, getVisitors);
router.get('/:id', requireAuth, getVisitor);

// 2. ONLY Admin can update/delete
// 👈 2. Yahan upload.single('photo') add karein
router.patch('/:id', requireAuth, requireAdmin, upload.single('photo'), updateVisitor);
router.delete('/:id', requireAuth, requireAdmin, deleteVisitor);

module.exports = router;