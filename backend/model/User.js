const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        maxLength: 50
    },
    firstName: {
        type: String,
        maxLength: 50,
    },
    lastName: {
        type: String,
        maxLength: 50,
    },
    phonePrimary: { 
        type: String,
    },
    phoneSecondary: { 
        type: String,
    },
    phonePrefix: {
        type: String,
    },
    phoneCountry: {
        type: String,
    },
    phoneCountryCode: {
        type: String,
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
    currency: {
        type: String,
        default: "cad"
    },
    currencySymbol: {
        type: String,
        default: "$"
    },
    active: {
        type: Boolean, //Not verified
        default: false
    },
    checkedMobile: {
        type: Boolean,
        default: false
    }, 
    receivedIdApproval: {
        type: Boolean,
        default: false
    },
    currentStage: {
        type: Number,
        default : 1 //1 - starting on phone, 2-finished phone verification, 3 finished photos
    },
    deactivated: {
        type: Boolean, //Banned
        default: false
    },
    lockedOut: {
        type: Boolean, //Missed password attempts
        default: false
    },
    requestedPayout: {
        type: Boolean, 
        default: false
    },
    requestedPayoutCurrency: {
        type: String, 
    },
    requestedPayoutOption: {
        type: String, 
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
    privacySetting: { 
        type: Number, 
        default: 1 //1-Public, 2-Private 
    },
    language: {
        type: String,
        default: "English",
        maxLength: 50
    },
    isHost: {
        type: Boolean,
        default: false,
    },
    primaryGeoData: {
        type: Object,
    },
    secondaryGeoData: {
        type: Object,
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
    escrow: [{
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
    frontObjectId: { 
        type: String
    },
    frontMediaURL: {
        type: String
    },
    backObjectId: { 
        type: String
    },
    backMediaURL: {
        type: String
    },
    braintreeId: {
        type: String
    },
    lessMotion: { 
        type: Boolean, 
        default: false 
    },
    pushNotifications: { 
        type: Boolean, 
        default: true 
    },
    emailNotifications: { 
        type: Boolean, 
        default: true 
    },
    smsNotifications: { 
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
    createdAt: { 
        type: Date, 
        default: Date.now
    },
});

module.exports = mongoose.model('User', userSchema, 'users');