const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var paymentSchema = new Schema({
    _outgoingUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    _receivingUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
    },
    amount: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: "CAD"
    },
    paymentToken: {
        type: String
    }
});

module.exports = mongoose.model('Payment', paymentSchema, 'payments');