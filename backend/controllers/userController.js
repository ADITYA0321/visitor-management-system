const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

// FIX 1: Added 'user' & 'manager' roles matching frontend UI
const ALLOWED_ROLES = ['admin', 'security', 'employee', 'visitor', 'user', 'manager'];
const MIN_PASSWORD_LENGTH = 6;

const createToken = (id, tokenVersion = 0) => 
    jwt.sign({ id, tokenVersion }, process.env.SECRET, { expiresIn: '3d' });

const safeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const validateUserDetails = ({ name, email, password, role }, passwordRequired = true) => {
    if (name !== undefined && (!name || !name.trim())) return 'Name cannot be empty';
    if (email !== undefined && (!email || !email.trim() || !validator.isEmail(email.trim()))) return 'Invalid email address';
    if (passwordRequired && !password) return 'Name, email, and password are required';
    if (password && password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    if (role !== undefined && !ALLOWED_ROLES.includes(role)) return 'Invalid role';
    return null;
};

const findUserOrRespond = async (id, res) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({ error: 'User not found' });
        return null;
    }
    const user = await User.findById(id).select('+password');
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return null;
    }
    return user;
};

const signupUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const validationError = validateUserDetails({ name, email, password });
        if (validationError || !name?.trim() || !email?.trim()) {
            return res.status(400).json({ error: validationError || 'Name, email, and password are required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ error: 'Email already exists' });

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: await bcrypt.hash(password, 10),
            role: 'visitor'
        });
        
        return res.status(201).json({ token: createToken(user._id, user.tokenVersion || 0), user: safeUser(user) });
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 11000) return res.status(409).json({ error: 'Email already exists' });
        return res.status(500).json({ error: 'Unable to create user' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        return res.status(200).json({ token: createToken(user._id, user.tokenVersion || 0), msg: 'Login success', ...safeUser(user) });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Unable to log in' });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        return res.status(200).json({ user: safeUser(user) });
    } catch (error) {
        console.error('Current-user error:', error);
        return res.status(500).json({ error: 'Unable to fetch current user' });
    }
};

// FIX 2: Fixed getUsers logic for role and search filtering
const getUsers = async (req, res) => {
    try {
        const filters = {};

        // Role filtering handle karna (Empty string ya 'all' ko ignore karna)
        if (req.query.role && req.query.role !== 'all' && req.query.role.trim() !== '') {
            if (!ALLOWED_ROLES.includes(req.query.role)) {
                return res.status(400).json({ error: 'Invalid role filter' });
            }
            filters.role = req.query.role;
        }

        // Search filtering regex logic
        if (req.query.search && req.query.search.trim() !== '') {
            const search = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filters.$or = [
                { name: { $regex: search,$options: 'i' } },
                { email: { $regex: search,$options: 'i' } }
            ];
        }

        const users = await User.find(filters).sort({ createdAt: -1 });
        return res.status(200).json({ users: users.map(safeUser) });
    } catch (error) {
        console.error('List-users error:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await findUserOrRespond(req.params.id, res);
        if (!user) return;
        return res.status(200).json({ user: safeUser(user) });
    } catch (error) {
        console.error('Get-user error:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
    }
};

const createUser = async (req, res) => {
    const { name, email, password, role = 'visitor' } = req.body;
    try {
        const validationError = validateUserDetails({ name, email, password, role });
        if (validationError || !name?.trim() || !email?.trim()) {
            return res.status(400).json({ error: validationError || 'Name, email, and password are required' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ error: 'Email already exists' });
        const user = await User.create({
            name: name.trim(), email: normalizedEmail, role,
            password: await bcrypt.hash(password, 10)
        });
        return res.status(201).json({ user: safeUser(user) });
    } catch (error) {
        console.error('Create-user error:', error);
        if (error.code === 11000) return res.status(409).json({ error: 'Email already exists' });
        return res.status(500).json({ error: 'Unable to create user' });
    }
};

const updateUser = async (req, res) => {
    const allowedFields = ['name', 'email', 'role'];
    const fields = Object.keys(req.body);
    if (!fields.length || fields.some((field) => !allowedFields.includes(field))) {
        return res.status(400).json({ error: 'Only name, email, and role can be updated here' });
    }
    try {
        const user = await findUserOrRespond(req.params.id, res);
        if (!user) return;
        const { name, email, role } = req.body;
        const validationError = validateUserDetails({ name, email, role }, false);
        if (validationError) return res.status(400).json({ error: validationError });
        if (role !== undefined && role !== user.role && user.role === 'admin') {
            if (await User.countDocuments({ role: 'admin' }) <= 1) return res.status(400).json({ error: 'The last admin cannot be demoted' });
        }
        if (role !== undefined && user._id.equals(req.user._id) && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot remove your own admin role' });
        }
        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();
            if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) return res.status(409).json({ error: 'Email already exists' });
            user.email = normalizedEmail;
        }
        if (role !== undefined) user.role = role;
        await user.save();
        return res.status(200).json({ user: safeUser(user) });
    } catch (error) {
        console.error('Update-user error:', error);
        return res.status(500).json({ error: 'Unable to update user' });
    }
};

const resetUserPassword = async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }
    try {
        const user = await findUserOrRespond(req.params.id, res);
        if (!user) return;

        user.password = await bcrypt.hash(password, 10);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset-password error:', error);
        return res.status(500).json({ error: 'Unable to reset password' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await findUserOrRespond(req.params.id, res);
        if (!user) return;
        if (user._id.equals(req.user._id)) return res.status(400).json({ error: 'You cannot delete your own account' });
        if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) return res.status(400).json({ error: 'The last admin cannot be deleted' });
        await user.deleteOne();
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete-user error:', error);
        return res.status(500).json({ error: 'Unable to delete user' });
    }
};

module.exports = {
    signupUser, loginUser, getCurrentUser,
    getUsers, getUser, createUser, updateUser, resetUserPassword, deleteUser
};