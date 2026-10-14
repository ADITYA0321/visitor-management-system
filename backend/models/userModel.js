const mongoose = require('mongoose')


const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false

    },
    
    tokenVersion: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ['admin', 'security', 'employee', 'visitor'],
        default: 'visitor'
    }

}, {
    timestamps: true
})

module.exports = mongoose.model('User', userSchema)
