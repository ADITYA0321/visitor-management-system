const requireAdmin = (req, res, next) => {
    // Check karo user logged in hai aur role 'admin' hai ya nahi
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Agar admin nahi hai, toh JSON me explicit error bhejo
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
};

module.exports = requireAdmin;