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
        default:""
    },
    entryfee: {
        type: Number,
        default: 0
    },
    multiply : {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('quiz', quizSchema);