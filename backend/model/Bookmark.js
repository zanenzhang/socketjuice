const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var bookmarkSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User' ,
        index: true
    },
    bookmarks: [{
        _hostProfileId: {
            type: Schema.Types.ObjectId, 
            ref: 'HostProfile'
        },
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }]
})

module.exports = mongoose.model('Bookmark', bookmarkSchema, 'bookmarks');