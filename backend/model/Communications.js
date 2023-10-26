const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var communicationsSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    },
    chats: [{
        _chatId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Chat',
            index: true
        },
        participants: [{
            _userId: { 
                type: Schema.Types.ObjectId, 
                ref: 'User',
                index: true
            },
            username: {
                type: String
            },
            isActive: {
                type: Boolean,
                default: true
            },
        }],
        participantsNumber: {
            type: Number
        },
        isActive: {
            type: Boolean,
            default: true
        },
        chatToken: {
            type: String
        },
        newAlerts: {
            type: Boolean,
            default: false
        },
        lastUpdated: {
            type: Date, 
            default: Date.now
        }
    }],
    messages: [{
        _messageId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Message'
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        },
    }],
    emails: [{
        subjectLine: {
            type: String, 
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        },
    }]
});

module.exports = mongoose.model('Communications', communicationsSchema, 'communications');