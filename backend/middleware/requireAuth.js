const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' })
    }

    const token = authorization.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.SECRET)

        // Fetching _id and role directly using decoded.id
        req.user = await User.findOne({ _id: decoded.id }).select('_id role')

        if (!req.user) {
            return res.status(401).json({ error: 'User not found' })
        }

        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ error: 'Request is not authorized' })
    }
}

module.exports = requireAuth