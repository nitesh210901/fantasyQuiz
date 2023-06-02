const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let JoinQuizTeamSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    type: {
        type: String,
        default: "quiz"
      },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listMatches',
        index: true
    },
    teamnumber: {
        type: Number,
        default: 0
    },
    quiz: [{
        questionId: {
            type: mongoose.Types.ObjectId
        },
        answer: {
            type: String,
            default:""
        },
        point: {
            type: Number,
            default:0
        }
    }],
    points: {
        type: Number,
        default: 0.0
    },
    lastpoints: {
        type: Number,
        default: 0.0
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    user_type: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('joinquizteam', JoinQuizTeamSchema);