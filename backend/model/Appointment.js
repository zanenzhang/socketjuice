const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var appointmentSchema = new Schema({
    _requestUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    _hostUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
    },
    passcode: { 
        type: String, 
        required: true 
    },
    title: {
        type: String,
        default: "Charging Request"
    },
    address: {
        type: String,
    },
    start: {
        type: Date,
    },
    end: {
        type: Date,
    },
    chargeAmount: {
        type: Number
    },
    chargeAmountFee: {
        type: Number
    },
    currency: {
        type: String
    },
    currencySymbol: {
        type: String
    },
    cancelRequestHostSubmit: {
        type: Boolean,
        default: false
    },
    cancelRequestDriverSubmit: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "Requested", //Requested, Approved, CancelSubmitted, Cancelled, Completed
    },
    reviewed: {
        type: Boolean,
        default: false
    },
    rejected: {
        type: Boolean,
        default: false
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
    requestDateStart: {
        type: String,
    },
    requestDateEnd: {
        type: String,
    }
});

module.exports = mongoose.model('Appointment', appointmentSchema, 'appointments');