const mongoose = require('mongoose')

const Schema = mongoose.Schema

const visitorSchema = new Schema ({
    name:{
        type: String,
        required: true
    },
    mobile:{
        type: String,
        required: true
    },
     email:{
        type: String,
        required: true
    },
     company:{
        type: String,
        required: true
    },
     purpose:{
        type: String,
        required: true
    },
     host:{
        type: String,
        
    },
     visitDate:{
        type: Date,
        required: true
    },
     status:{
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Checked In', 'Checked Out'],
        required:true,
        default: 'Pending'
        
    },
     createdBy:{
       type: Schema.Types.ObjectId,

        required: true
        
    },
})

module.exports = mongoose.model('Visitor', visitorSchema)