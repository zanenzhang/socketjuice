const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var chatSchema = new Schema({
    participants: [{ 
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        },
        firstName: {
            type: String
        },
        lastName: {
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
    mostRecentMessage:{
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        },
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        content: {
            type: String
        },
        lastUpdated: {
            type: Date
        }
    },
    flagged: {
        type: Boolean,
        default: false
    },
    hidden: {
        type: Boolean,
        default: false
    },
    messages: [{ 
        _messageId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Message' 
        }
    }],
    messageCount: {
        type: Number,
        default: 0
    },
    chatToken: {
        type: String
    },
    newMessages: {
        type: Number
    },
    lastUpdated: { 
        type: Date
    }
});

module.exports = mongoose.model('Chat', chatSchema, 'chats');