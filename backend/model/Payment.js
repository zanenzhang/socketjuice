const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var paymentSchema = new Schema({
    _sendingUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    _receivingUserId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
    },
    amount: {
        type: Number,
        default: 0
    },
    fee: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
    },
    currencySymbol: {
        type: String,
    },
    paymentToken: {
        type: String
    },
    refunded: {
        type: Boolean,
        default: false
    },
    payin: {
        type: Boolean,
        default: false
    },
    payout: {
        type: Boolean,
        default: false
    },
    flagged: {
        type: Boolean,
        default: false
    },
    paypalOrderId: {
        type: String
    },
    gross_amount: {
        currency_code: {
            type: String
        },
        value: {
            type: String
        },
    },
    net_amount: {
        currency_code: {
            type: String
        },
        value: {
            type: String
        },
    },
    receivable_amount: {
        currency_code: {
            type: String
        },
        value: {
            type: String
        },
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    },
});

module.exports = mongoose.model('Payment', paymentSchema, 'payments');