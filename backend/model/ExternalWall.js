const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var externalWallSchema = new Schema({
    userIP: { 
        type: String
    },
    Total_GoogleRecaptcha: {
        type: Number,
        default: 0
    },
    Total_LoginAttempts: {
        type: Number,
        default: 0
    },
    Total_LockedLoginAttempts: {
        type: Number,
        default: 0
    },
    Total_Registrations: {
        type: Number,
        default: 0
    },
    Total_PassResets: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('ExternalWall', externalWallSchema, 'externalwalls');