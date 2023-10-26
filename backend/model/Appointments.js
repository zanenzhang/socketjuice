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
    appointmentStart: {
        type: Date,
    },
    appointmentEnd: {
        type: Date,
    },
});

module.exports = mongoose.model('Appointment', appointmentSchema, 'appointments');