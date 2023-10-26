const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

var hostProfileSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    displayname: {
        type: String,
        maxLength: 50,
    },
    availabilities: [{
        startDate: {
            type: Date,
        },
        endDate:{
            type: Date,
        }
    }],
    bookings: [{
        startDate: {
            type: Date,
        },
        endDate:{
            type: Date,
        }
    }],
    phonePrimary: { 
        type: String,
        // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
    },
    phoneSecondary: { 
        type: String,
        // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
    },
    chargingLevel: {
        type: String,
    },
    chargingType: {
        type: String,
    },
    hostComments: {
        type: String,
        maxLength: 2000,
        default: "Welcome! No additional comments!"
    },
    address: {
        type: String,
        required: true,
        maxLength: 50
    },
    city: {
        type: String,
        required: true,
        maxLength: 50
    },
    region: {
        type: String,
        required: true,
        maxLength: 50
    },
    regionCode: {
        type: String,
        required: true,
        maxLength: 50
    },
    country: {
        type: String,
        required: true,
        maxLength: 50
    },
    smallThumbnail: {
        type: String
    },
    coverThumbnail: {
        type: String
    },
    postalCode: {
        type: String,
        maxLength: 10
    },
    neighborhood: {
        type: String,
        maxLength: 50
    },
    location: {
        type: { type: String, maxLength: 50 },
        coordinates: [Number], //Longitude first, then latitude
    },
    lessMotion: { 
        type: Boolean, 
        default: false 
    },
    pushNotifications: { 
        type: Boolean, 
        default: true 
    },
    userTheme: { 
        type: String,
        default: 'light',
        maxLength: 50
    },
    userFont: {
        type: String,
        maxLength: 50
    },
    verifiedHost: { 
        type: Boolean, 
        default: false 
    },
    hostAppointments: [{  
        _appointmentId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Appointment',
            index: true
        },
        createdAt: {
            type: Date, 
            default: Date.now
        }
    }],
    numberOfHostAppointments: {
        type: Number,
        default: 0
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
})


// storeProfileSchema.index({storename: 'text', displayname: 'text'});
// storeProfileSchema.plugin(mongoose_fuzzy_searching, { fields: ['storename','displayname'] });
module.exports = mongoose.model('HostProfile', hostProfileSchema, 'hostprofiles');
