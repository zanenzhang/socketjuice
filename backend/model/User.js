const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        maxLength: 50
    },
    username: {
        type: String,
        required: true,
        maxLength: 50
    },
    roles: {
        User: {
            type: Number,
            default: 2001
        },
        Manager: Number,
        Admin: Number
    },
    password: {
        type: String,
        required: true        
    },
    twitterId: {
        type: String,
    },
    facebookId: {
        type: String,
    },
    linkedinId: {
        type: String,
    },
    googleId: {
        type: String,
    },
    microsoftId: {
        type: String,
    },
    currency: {
        type: String,
        default: "CAD"
    },
    showFXPriceSetting: { 
        type: Number, 
        default: 2 //1-Show Home Currency Prices, 2-Show Foreign Prices
    },
    active: {
        type: Boolean, //Not verified
        default: false
    },
    deactivated: {
        type: Boolean, //Banned
        default: false
    },
    isStore: {
        type: Boolean,
        default: false
    },
    lockedOut: {
        type: Boolean, //Missed password attempts
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    flagged: {
        type: Boolean,
        default: false
    },
    flaggedBy: [{
        _userId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User' 
        }
    }],
    flagsCount: {
        type: Number,
        default: 0
    },
    refreshToken: String,
    profilePicKey: { 
        type: String
    },
    profilePicURL: {
        type: String,
        default: '/images/avatars/defaultUserPic.svg',
        index: true
    },
    blockedUsers: [{ 
        _userId: { 
            type: Schema.Types.ObjectId,
            ref: 'User' 
        }
    }],
    privacySetting: { 
        type: Number, 
        default: 1 //1-Public, 2-Private 
    },
    influencerRating: { 
        type: Number, 
        default: 0 //0 - low, 5 - high
    },
    language: {
        type: String,
        default: "English",
        maxLength: 50
    },
    primaryGeoData: {
        type: Object,
    },
    secondaryGeoData: {
        type: Object,
    },
    totalGems: {
        type: Number,
        default: 0
    },
    preferredCity: {
        type: String,
        default: "Select All"
    },
    preferredRegion: {
        type: String,
        default: "Select All"
    },
    preferredCountry: {
        type: String,
        default: "Select All"
    },
    preferredCategory: {
        type: String,
        default: "All"
    },
    credits: [{
        currency:{
            type: String, 
        },
        currencySymbol:{
            type: String, 
        },
        amount:{
            type: Number, 
        } 
    }],
    gender: {
        type: String,
        default: "unisex"
    },
    initialRetailers: [{
        type: String
    }],
    genderSet:{
        type: Boolean,
        default: false
    },
    canReceivePayments: { 
        type: Number, 
        default: 0 //0 - No, 1 - Yes
    },
    lastLogin: {
        type: Date
    },
    lastPosting: {
        type: Date,
        default: new Date("1/1/23"),
        index: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    },
});

module.exports = mongoose.model('User', userSchema, 'users');