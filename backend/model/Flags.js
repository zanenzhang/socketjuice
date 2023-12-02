const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var flagSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' ,
        index: true
    },
    userFlags: [{
        _userId: {
            type: Schema.Types.ObjectId, 
            ref: 'User'
        },
        comment: {
            type: String,
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }],
    appointmentFlags: [{
        _appointmentId: {
            type: Schema.Types.ObjectId, 
            ref: 'Appointment'
        },
        _flaggedByUserId: {
            type: Schema.Types.ObjectId, 
            ref: 'User'
        },
        _violationUserId: {
            type: Schema.Types.ObjectId, 
            ref: 'User'
        },
        comment: {
            type: String,
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }]
})

module.exports = mongoose.model('Flag', flagSchema, 'flags');