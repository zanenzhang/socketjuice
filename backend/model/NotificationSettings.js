const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var notificationSettingsSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    pushAlerts: {
        type: Boolean,
        default: false
    },
    alertSounds: {
        type: Boolean,
        default: false
    },
    alertMotion: {
        type: Boolean,
        default: false
    },
    newAlerts: {
        type: Boolean,
        default: false
    },
    newMessages: {
        type: Boolean,
        default: false
    },
    newRequests: {
        type: Boolean,
        default: false
    },
    emailNotis: [{
        date: { 
            type: String, 
        },
        _recipientUserId: {
            type: Schema.Types.ObjectId, 
            ref: 'User',
        }
    }],
    smsNotis: [{
        date: { 
            type: String, 
        },
        _recipientUserId: {
            type: Schema.Types.ObjectId, 
            ref: 'User',
        }
    }],
})

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema, 'notificationsettings');