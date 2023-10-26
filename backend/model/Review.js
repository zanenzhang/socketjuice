const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var reviewSchema = new Schema({
    _givingReviewUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
        index: true 
    },
    _receivingReviewUserId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User',
    },
    reviewStars: { 
        type: Number, 
        default: 3
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    },
});

module.exports = mongoose.model('Review', reviewSchema, 'reviews');