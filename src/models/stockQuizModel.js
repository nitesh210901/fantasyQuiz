const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let quizSchema = new Schema({
    question: {
        type: String,
        default:""
    },
    option_1: {
        type: String,
        default:" "
    },
    option_2: {
        type: String,
        default:" "
    },
    option_3: {
        type: String,
        default:" "
    },
    answer: {
        type: String,
        default:"Please Give Answer"
    },
    entryfee: {
        type: Number,
        default: 0
    },
    start_date: {
        type: String,
        default: " "
    },
    end_date: {
        type: String,
        default: " "
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockquiz', quizSchema);