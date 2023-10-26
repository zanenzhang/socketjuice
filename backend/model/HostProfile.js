const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

var hostProfileSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    storename: {
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
    website: {
        type: String,
        maxLength: 50
    },
    announcements: {
        type: String,
        maxLength: 200,
        default: "No announcements"
    },
    regularHours: {
        type: String,
        default: "Monday-Friday 9:00AM to 9:00PM"
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
    holidayHours: {
        type: String,
        maxLength: 100,
        default: "9:00AM - 3:00PM"
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
    storePosts: [{  
        _postId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Post' 
        }, //Sort by category name, then post name
        primaryCategory: {
            type: String,
            default: "All"
        },
        postClass:{
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date, 
            default: Date.now
        } 
    }],
    storeOrders: [{  
        _orderId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Order',
            index: true
        },
        _postId:{
            type: Schema.Types.ObjectId, 
            ref: 'Post',
        },
        PaymentIntentId: {
            type: String
        },
        currency: {
            type: String,
            default: "CAD"
        },
        paidSubtotalPrice: {
            type: Number,
        },
        totalShippingCost:{
            type: Number,
        },
        totalPaidPrice: {
            type: Number,
        },
        createdAt: {
            type: Date, 
            default: Date.now
        }
    }],
    taggedPosts: [{
        _postId: [{ 
            type: Schema.Types.ObjectId, 
            ref: 'Post' 
        }], //Sort by category name, then post name
        count: { 
            type: Number
        },
        createdAt: {
            type: Date, 
            default: Date.now
        } 
    }],
    storeTags: [{
        tag: { 
            type: String,
            maxLength: 50
        }, 
        count: { 
            type: Number
        }
    }],
    storeCategories: [{
        type: String,
        maxLength: 100
    }],
    phonePrimary: { 
        type: String,
        // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
    },
    phoneSecondary: { 
        type: String,
        // match: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/
    },
    totalLikes: {
        type: Number,
        default: 0
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
    retailerRanking: {
        type: Number,
        default: 6
    },
    retailerId: {
        type: Number
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
    manager: {
        type: String,
        maxLength: 50
    },
    chain: {
        type: String,
        default: "No"
    },
    chainId: {
        type: String,
        maxLength: 150
    },
    relatedStores: [{
        type: Schema.Types.ObjectId, 
        ref: 'User',
    }],
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
        default: 'light',
        maxLength: 50
    },
    userFont: {
        type: String,
        maxLength: 50
    },
    dailyUploads: [{
        date: {
            type: Date,
            default: Date.now
        },
        dailyUpload:{
            type: Number,
            default: 1
        }
    }],
    verified: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
})


// storeProfileSchema.index({storename: 'text', displayname: 'text'});
// storeProfileSchema.plugin(mongoose_fuzzy_searching, { fields: ['storename','displayname'] });
module.exports = mongoose.model('HostProfile', hostProfileSchema, 'hostprofiles');
