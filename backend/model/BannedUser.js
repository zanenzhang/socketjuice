const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var bannedUserSchema = new Schema({
    admin: {
        type: String
    },
    ipAddresses: [{
        userIP: { 
            type: String,
            index: true
        }
    }]
});

module.exports = mongoose.model('BannedUser', bannedUserSchema, 'bannedusers');