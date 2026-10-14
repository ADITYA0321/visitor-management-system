const express = require('express');
const { signupUser, loginUser, getCurrentUser } = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
