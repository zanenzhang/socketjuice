const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var activateTokenSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    token: { 
        type: String, 
        required: true 
    },
    expireAt: { 
        type: Date, 
        default: Date.now, 
        index: { expires: 7200000 } 
    }
});

module.exports = mongoose.model('ActivateToken', activateTokenSchema, 'activatetokens');