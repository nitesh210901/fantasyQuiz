const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let quizuserAnswerSchema = new Schema({
    matchkey: {
        type : mongoose.Types.ObjectId
    },
    userId: {
        type : mongoose.Types.ObjectId
    },
    quizId: {
        type : mongoose.Types.ObjectId
    },
    answer: {
        type: String,
        default:""
    },
    amount: {
        type: Number,
        default:0
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('quizuseranswer', quizuserAnswerSchema);