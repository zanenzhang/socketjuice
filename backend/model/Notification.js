const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var notificationSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    _otherUserId: { 
        type: Schema.Types.ObjectId,
        ref: 'User' 
    }, 
    notificationType: {
        type: String //appointment approved, appointment requested, message, review
    },
    _relatedAppointment: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment' 
    },
    _relatedChat: {
        type: Schema.Types.ObjectId,
        ref: 'Chat' 
    },
    _relatedMessage: {
        type: Schema.Types.ObjectId,
        ref: 'Message' 
    },
    messageContent: {
        type: String
    },
    readAlert: {
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
})

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');