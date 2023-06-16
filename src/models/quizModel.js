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
    multiply : {
        type: Number,
        default: 0
    },
    bonus_percentage: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default:"opened"
    },
    image: {
        type: String,
        default:""
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('quiz', quizSchema);