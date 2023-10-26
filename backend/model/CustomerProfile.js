const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

var customerProfileSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    username: {
        type: String,
        maxLength: 50,
    },
    fullname: { 
        type: String,
        maxLength: 50,
    },
    city: {
        type: String
    },
    region: {
        type: String
    },
    regionCode: {
        type: String
    },
    country: { 
        type: String,
        maxLength: 50
    },
    phonePrimary: { 
        type: String,
        maxLength: 50
        // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
    },
    lessMotion: { 
        type: Boolean, 
        default: false 
    },
    pushNotifications: { 
        type: Boolean, 
        default: false 
    },
    userTheme: { 
        type: String,
        default: "light",
        maxLength: 50
    },
    userFont: {
        type: String,
        maxLength: 50
    },
    birthDate: { 
        type: Date,
        default: "01/01/1980"
    },
    userAppointments: [{  
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
    numberOfCustAppointments: {
        type: Number,
        default: 0
    },
    phoneContacts: [{
        contactName: {
            type: String,
            maxLength: 20
        },
        contactNumber:{
            type: String,
            maxLength: 20,
            // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
        }
    }],
    createdAt: { 
        type: Date, 
        default: Date.now
    }
});

// userProfileSchema.index({username: 'text', fullname: 'text'});
// userProfileSchema.plugin(mongoose_fuzzy_searching, { fields: ['username','fullname'] });
module.exports = mongoose.model('CustomerProfile', customerProfileSchema, 'customerprofiles');
