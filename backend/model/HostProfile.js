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
    defaultavailability: [{
        startDate: {
            type: Date,
        },
        endDate:{
            type: Date,
        }
    }],
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
    connectionType: {
        type: String,
    },
    regularHoursMondayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursTuesdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursWednesdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursThursdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursFridayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursSaturdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursSundayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    regularHoursMondayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    regularHoursTuesdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    regularHoursWednesdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    regularHoursThursdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    regularHoursFridayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    regularHoursSaturdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    regularHoursSundayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    closedOnMonday: {
        type: Boolean,
        default: false
    }, 
    closedOnTuesday: {
        type: Boolean,
        default: false
    },
    closedOnWednesday: {
        type: Boolean,
        default: false
    },
    closedOnThursday: {
        type: Boolean,
        default: false
    },
    closedOnFriday: {
        type: Boolean,
        default: false
    },
    closedOnSaturday: {
        type: Boolean,
        default: false
    },
    closedOnSunday: {
        type: Boolean,
        default: false
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
    bookmarksCount: {
        type: Number,
        default: 0
    },
    bookmarkedBy: [{
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User',
            index: true
        },
        bookmarkedCount: {
            type: Number,
            default: 0
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
})


module.exports = mongoose.model('HostProfile', hostProfileSchema, 'hostprofiles');
