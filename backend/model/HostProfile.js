const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

var hostProfileSchema = new Schema({
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
    chargers: [{
        _chargerId: {
            type: Schema.Types.ObjectId, 
            required: true, ref: 'Charger',
        },
    }],
    numberOfReceivedReviews: {
        type: Number,
        default: 0
    },
    numberOfTotalStars: {
        type: Number,
        default: 0
    },
    bookings: [{
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
    hoursMondayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursTuesdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursWednesdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursThursdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursFridayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursSaturdayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursSundayStart: {
        type: String,
        maxLength: 100,
        default: "09:00"
    },
    hoursMondayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    hoursTuesdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    hoursWednesdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    hoursThursdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    hoursFridayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    hoursSaturdayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    hoursSundayFinish: {
        type: String,
        maxLength: 100,
        default: "17:00"
    },
    holidayHoursStart: {
        type: String,
        maxLength: 100,
        default: "10:00"
    },
    holidayHoursFinish: {
        type: String,
        maxLength: 100,
        default: "15:00"
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
    closedOnHolidays: {
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
    submittedChargingForReview: { 
        type: Boolean, 
        default: false 
    },
    verifiedHostCharging: { 
        type: Boolean, 
        default: false 
    },
    deactivated: {
        type: Boolean, 
        default: false 
    },
    chargeRatePerHalfHour: {
        type: Number,
        default: 3.00
    },
    numberOfChargersAtLocation:{
        type: Number,
        default: 1
    },
    currency: {
        type: String,
        default: "cad"
    },
    currencySymbol: {
        type: String,
        default: "$"
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
    numberOfAppointmentCancellations: {
        type: Number,
        default: 0
    },
    incomingPayments: [{  
        _paymentId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Payment',
            index: true
        },
        amount: {
            type: Number, 
            default: 0
        },
        currency: {
            type: Number, 
            default: 0
        },
        refunded: {
            type: Boolean,
            default: false
        }
    }],
    receivedReviews: [{
        _reviewId: {
            type: Schema.Types.ObjectId,
            ref: 'Review',
            index: true
        },
        reviewStars: {
            type: Number,
            default: 3
        }
    }],
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

hostProfileSchema.index({location: "2dsphere"})

module.exports = mongoose.model('HostProfile', hostProfileSchema, 'hostprofiles');
