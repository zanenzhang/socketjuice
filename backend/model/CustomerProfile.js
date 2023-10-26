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
    relationshipStatus: { 
        type: String,
        maxLength: 20
    },
    userGroup: { 
        type: String,
        maxLength: 50
    },
    taggedPosts: [{
        _postId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Post'
        },
        count: { 
            type: Number
        },
        createdAt: {
            type: Date, 
            default: Date.now
        } 
    }],
    birthDate: { 
        type: Date,
        default: "01/01/1980"
    },
    userPosts: [{  
        _postId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Post',
            index: true
        },
        primaryCategory: {
            type: String,
            default: "All",
            maxLength: 50
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
    userOrders: [{  
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
    numberOfPosts: {
        type: Number,
        default: 0
    },
    valueGemCount: {
        type: Number,
        default: 0
    },
    followRequests: [{ 
        _RequestedUserId: { 
            type: Schema.Types.ObjectId, 
            required: true, ref: 'User' 
        }
    }],
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
