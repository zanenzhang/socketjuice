const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var resetPassTokenSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User' 
    },
    token: { 
        type: String, 
        required: true,
        index: true
    },
    expireAt: { 
        type: Date, 
        default: Date.now, 
        index: { expires: 6000000 }
    }
});

module.exports = mongoose.model('ResetPassToken', resetPassTokenSchema, 'resetpasstokens');