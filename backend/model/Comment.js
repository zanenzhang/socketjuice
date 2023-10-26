const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var commentSchema = new Schema({
    _postId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'Post',
        index: true
    },
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User' 
    },
    username: {
        type: String
    },
    content: {
        type: String
    },
    language: {
        type: String
    },
    hasReply: {
        type: Boolean,
        default: false
    },
    commentReplies: [{
        _commentId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Comment' 
        },
        _userId: {
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        },
        username: {
            type: String
        },
        content: {
            type: String
        },
        commentTags: [{
            tag: { 
                type: String
            }, 
            count: { 
                type: Number
            }
        }],
        likedBy: [{
            _userId: { 
                type: Schema.Types.ObjectId, 
                ref: 'User' 
            },
            username: {
                type: String
            }
        }],
        valuedBy: [{
            _userId: { 
                type: Schema.Types.ObjectId, 
                ref: 'User' 
            },
            username: {
                type: String
            }
        }],
        isReply: {
            type: Number,
            default: 0
        },
        _repliedToComment: { 
            type: Schema.Types.ObjectId, 
            ref: 'Comment' 
        },
        _repliedToUsername: {
            type: String
        },
        _originalCommentId:{
            type: Schema.Types.ObjectId, 
            ref: 'Comment' 
        },
        likesCount: {
            type: Number,
            default: 0
        },
        valuesCount: {
            type: Number,
            default: 0
        },
        hidden: {
            type: Boolean,
            default: false
        },
        edited: {
            type: Boolean,
            default: false
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }],
    commentTags: [{
        tag: { 
            type: String
        }, 
        count: { 
            type: Number
        }
    }],
    likedBy: [{
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        },
        username: {
            type: String
        }
    }],
    valuedBy: [{
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        }
    }],
    isReply: {
        type: Number,
        default: 0
    },
    _repliedToComment: { 
        type: Schema.Types.ObjectId, 
        ref: 'Comment' 
    },
    _repliedToUsername: {
        type: String
    },
    _originalCommentId:{
        type: Schema.Types.ObjectId, 
        ref: 'Comment' 
    },
    flagged: {
        type: Boolean,
        default: false
    },
    flaggedBy: [{
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        }
    }],
    flagsCount: {
        type: Number,
        default: 0
    },
    likesCount: {
        type: Number,
        default: 0
    },
    valuesCount: {
        type: Number,
        default: 0
    },
    hidden: {
        type: Boolean,
        default: false
    },
    edited: {
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
})

module.exports = mongoose.model('Comment', commentSchema, 'comments');