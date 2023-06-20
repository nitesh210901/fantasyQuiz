const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let leaugestransaction = new Schema({
        bonus: {
            type: Number,
            default: 0
        },
        winning: {
            type: Number,
            default: 0
        },
        balance: {
            type: Number,
            default: 0
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }, {
        timestamps: true,
        versionKey: false
    })
    // --------------------------------------------------------------//
let quizjoinedleaugeSchema = new Schema({
    refercode: {
        type: String,
        default: ''
    },
    transaction_id: {
        type: String,
        default: ''
    },
    teamNumbercount: {
        type: Number,
        defalut: 0
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'quiz',
        index:true
    },
    teamid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team'
    },
    teamnumber: {
        type: Number,
        default: 0
    },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listmatch',
        index:true
    },
    seriesid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'series'
    },
    leaugestransaction: leaugestransaction,
    is_deleted: {
        type: Boolean,
        default: false
    },
    user_type: {
        type:Number,
        default:0
    },
    answer: {
        type: String,
        default:""
    },
    winamount: {
        type: Number,
        default:0
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('quizjoinedleauge', quizjoinedleaugeSchema);