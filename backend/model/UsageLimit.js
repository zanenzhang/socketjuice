const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var usageLimitSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true
    },
    phoneNumber: {
        type: String
    },
    emailVerifications: {
        type: Number,
        default: 0
    },
    passwordResetRequests: {
        type: Number,
        default: 0
    },
    numberOfMessages: [{
        date: { 
            type: String, 
        },
        messagesNumber: {
            type: Number
        }
    }],
    numberOfGoogleCoordRequests: [{
        date: { 
            type: String, 
        },
        requestsNumber: {
            type: Number
        }
    }],
    numberOfGoogleMatrixRequests: [{
        date: { 
            type: String, 
        },
        requestsNumber: {
            type: Number
        }
    }],
    numberOfAppointments: [{
        date: { 
            type: String, 
        },
        appointmentsNumber: {
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
    numberOfMessageEmails: [{
        date: { 
            type: String, 
        },
        emailsNumber: {
            type: Number
        }
    }],
    numberOfMessageTexts: [{
        date: { 
            type: String, 
        },
        textsNumber: {
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