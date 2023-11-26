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
    currency: {
        type: String,
    },
    paymentToken: {
        type: String
    },
    refunded: {
        type: Boolean,
        default: false
    },
    flagged: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Payment', paymentSchema, 'payments');