const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var activityLogSchema = new Schema({
    _userId: { 
        type: Schema.Types.ObjectId, 
        required: true, ref: 'User' ,
        index: true
    },
    activity: [{ 
        activityType: { 
            type: String, 
            required: true //login
        }, 
        createdAt: { 
            type: Date, 
            default: Date.now
        }
    }],
});

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'activitylogs');