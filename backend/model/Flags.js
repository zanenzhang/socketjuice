const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var flagSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' ,
        index: true
    },
    postFlags: [{
        _postId: {
            type: Schema.Types.ObjectId, 
            ref: 'Post'
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }],
    productFlags: [{
        _productId: {
            type: Schema.Types.ObjectId, 
            ref: 'Product'
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }],
    commentFlags: [{
        _commentId: {
            type: Schema.Types.ObjectId, 
            ref: 'Comment'
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }],
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