const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let quizSchema = new Schema({
    matchkey_id: {
        type : mongoose.Types.ObjectId
    },
    question: {
        type: String,
        default:""
    },
    option_A: {
        type: String,
        default:""
    },
    option_B: {
        type: String,
        default:""
    },
    option_C: {
        type: String,
        default:""
    },
    option_D: {
        type: String,
        default:""
    },
    answer: {
        type: String,
        default:""
    },
    point: {
        type: Number,
        default:0
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('quiz', quizSchema);