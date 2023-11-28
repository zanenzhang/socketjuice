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
    j1772ACChecked: {
        type: Boolean,
        default: false
    },
    ccs1DCChecked: {
        type: Boolean,
        default: false
    },
    mennekesACChecked: {
        type: Boolean,
        default: false
    },
    gbtACChecked: {
        type: Boolean,
        default: false
    },
    ccs2DCChecked: {
        type: Boolean,
        default: false
    },
    chademoDCChecked: {
        type: Boolean,
        default: false
    },
    gbtDCChecked: {
        type: Boolean,
        default: false
    },
    teslaChecked: {
        type: Boolean,
        default: false
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
    numberOfAppointmentCancellations: {
        type: Number,
        default: 0
    },
    numberOfReceivedReviews: {
        type: Number,
        default: 0
    },
    numberOfTotalStars: {
        type: Number,
        default: 0
    },
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
    outgoingPayments: [{  
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
            type: String,
            default: "cad"
        },
        currencySymbol: {
            type: String, 
        },
        refunded: {
            type: Boolean,
            default: false
        },
        paypalOrderId: {
            type: String
        },
        payin: {
            type: Boolean,
            default: false
        },
        payout: {
            type: Boolean,
            default: false
        },
    }],
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
