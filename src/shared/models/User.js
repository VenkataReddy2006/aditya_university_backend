const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true,
        enum: ['AEC', 'ACET', 'AUS']
    },
    profile: {
        type: Object,
        default: {}
    },
    attendance: {
        type: Object,
        default: {}
    },
    todayAttendance: {
        type: Object,
        default: {}
    },
    marks: {
        type: Object,
        default: {}
    },
    marksHistory: {
        type: Object,
        default: {}
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
