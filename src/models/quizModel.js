const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let quizSchema = new Schema({
    matchkey: {
        type : mongoose.Types.ObjectId
    },
    question: {
        type: String,
        default:""
    },
    options: [],
    answer: {
        type: String,
        default:"Please Give Answer"
    },
    entryfee: {
        type: Number,
        default: 0
    },
    winning_amount : {
        type: Number,
        default: 0
    },
    is_bonus: {
        type: Number,
        default: 0
    },
    bonus_percentage: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default:""
    },
    quiz_status: {
        type: String,
        default:"pending"
    },
    joinedusers: {
        type: Number,
        default: 0
    },
    is_selected: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('quiz', quizSchema);