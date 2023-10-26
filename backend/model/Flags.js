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
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }]
})

module.exports = mongoose.model('Flag', flagSchema, 'flags');