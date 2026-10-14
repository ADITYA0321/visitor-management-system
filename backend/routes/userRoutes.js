const express = require('express');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    resetUserPassword,
    deleteUser
} = require('../controllers/userController');

const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.route('/').get(getUsers).post(createUser);

router.get('/:id', getUser);

router.patch('/:id', updateUser);

router.patch('/:id/password', resetUserPassword);

router.delete('/:id', deleteUser);

module.exports = router;