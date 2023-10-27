const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

var driverProfileSchema = new Schema({
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
        contactNumber: {
            type: String,
            maxLength: 20,
            // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
        }
    }],
    previewMediaObjectId: { //Just for images
        type: String
    },
    mediaCarouselObjectIds: [{type: String, default: ""}], //For images and covers
    videoCarouselObjectIds: [{type: String, default: ""}], //Just for videos
    mediaCarouselObjectTypes: [{type: String, default: ""}], //To track whether media is image or video
    previewMediaURL: {
        type: String
    },
    previewMediaType: {
        type: String
    },
    coverIndex: {
        type: Number,
        default: 0
    },
    mediaCarouselURLs: [{type: String, default: ""}], //For images
    videoCarouselURLs: [{type: String, default: ""}], //For videos
    createdAt: { 
        type: Date, 
        default: Date.now
    }
});

// userProfileSchema.index({username: 'text', fullname: 'text'});
// userProfileSchema.plugin(mongoose_fuzzy_searching, { fields: ['username','fullname'] });
module.exports = mongoose.model('DriverProfile', driverProfileSchema, 'driverprofiles');