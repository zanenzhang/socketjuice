const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var messageSchema = new Schema({
    _chatId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'Chat',
        index: true
    },
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User' 
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    flagged: {
        type: Boolean,
        default: false
    },
    hidden: {
        type: Boolean,
        default: false
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    content: {
        type: String
    },
    language: {
        type: String
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    },
});

module.exports = mongoose.model('Message', messageSchema, 'messages');