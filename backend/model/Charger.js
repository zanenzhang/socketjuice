const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

var chargerSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
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
    chargeRatePerHalfHour: {
        type: Number,
        default: 3.00
    },
    currency: {
        type: String,
        default: "cad"
    },
    currencySymbol: {
        type: String,
        default: "$"
    },
    hostComments: {
        type: String,
        maxLength: 2000,
        default: "Welcome! No additional comments!"
    },
    address: {
        type: String,
        required: true,
        maxLength: 150
    },
    city: {
        type: String,
        required: true,
        maxLength: 150
    },
    region: {
        type: String,
        required: true,
        maxLength: 150
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
        type: {
            type: String,
            enum: ['Point', "Polygon"],
            default: "Point",
            required: true
        },
        coordinates: {
            type: [Number], //Longitude first, then latitude
            required: true
        },
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

chargerSchema.index({location: "2dsphere"})

module.exports = mongoose.model('Charger', chargerSchema, 'chargers');
