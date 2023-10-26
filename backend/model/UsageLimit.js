const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var usageLimitSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true
    },
    emailVerifications: {
        type: Number,
        default: 0
    },
    passwordResetRequests: {
        type: Number,
        default: 0
    },
    numberOfPosts: [{
        date: { 
            type: String, 
        },
        postsNumber: {
            type: Number
        }
    }],
    numberOfComments: [{
        date: { 
            type: String, 
        },
        commentsNumber: {
            type: Number
        }
    }],
    numberOfMessages: [{
        date: { 
            type: String, 
        },
        messagesNumber: {
            type: Number
        }
    }],
    numberOfEmailInvitations: [{
        date: { 
            type: String, 
        },
        invitationsNumber: {
            type: Number
        }
    }],
    numberOfEmailReports: [{
        date: { 
            type: String, 
        },
        reportsNumber: {
            type: Number
        }
    }],
    numberOfBookmarks: [{
        date: { 
            type: String, 
        },
        bookmarksNumber: {
            type: Number
        }
    }],
    numberOfShares: [{
        date: { 
            type: String, 
        },
        sharesNumber: {
            type: Number
        }
    }],
    numberOfOrders: [{
        date: { 
            type: String, 
        },
        ordersNumber: {
            type: Number
        }
    }],
    numberOfValues: [{
        date: { 
            type: String, 
        },
        valuesNumber: {
            type: Number
        }
    }],
    numberOfFlagsGiven: [{
        date: { 
            type: String, 
        },
        flagsNumber: {
            type: Number
        }
    }],
    warningsCount: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('UsageLimit', usageLimitSchema, 'usagelimits');